import { Client } from "langsmith";
import { evaluate } from "langsmith/evaluation";
import {
  type AgentResult,
  type NewsletterInput,
  runNewsletterAgent,
} from "@/inngest/functions/newsletter-agent";
import { EVAL_DATASET } from "./dataset";
import { accuracyEvaluator } from "./evaluators/accuracy";
import { latencyEvaluator } from "./evaluators/latency";
import { rankingEvaluator } from "./evaluators/ranking";
import { relevancyEvaluator } from "./evaluators/relevancy";
import { toolUsageEvaluator } from "./evaluators/tool-usage";

// ── Helpers ─────────────────────────────────────────────────────────

function formatInputForJudge(input: NewsletterInput): string {
  return [
    `Title: ${input.title}`,
    `Description: ${input.description ?? "N/A"}`,
    `Frequency: ${input.frequency}`,
    `Keywords: ${input.keywords.join(", ")}`,
    `Tier: ${input.tier ?? "free"}`,
  ].join("\n");
}

function formatDigestForJudge(result: AgentResult): string {
  const d = result.digest;
  const stories = d.sections
    .flatMap((s) =>
      s.items.map(
        (item) =>
          `- [${item.category}] ${item.title}\n  Detail: ${item.detail}\n  Sources: ${item.sources.map((src) => `${src.name} (${src.url})`).join(", ")}${item.quote ? `\n  Quote: "${item.quote}"` : ""}`,
      ),
    )
    .join("\n");

  return [
    `Edition Title: ${d.editionTitle}`,
    `Summary: ${d.summary}`,
    `Key Takeaways:\n${d.keyTakeaways.map((t) => `- ${t}`).join("\n")}`,
    `\nStories:\n${stories}`,
    `\nBottom Line: ${d.bottomLine}`,
  ].join("\n");
}

function formatToolLogForJudge(result: AgentResult): string {
  return result.toolCallLog
    .map((tc) => {
      const args =
        typeof tc.args === "object" ? JSON.stringify(tc.args) : String(tc.args);
      return `[step ${tc.stepNumber}] ${tc.toolName}(${args})`;
    })
    .join("\n");
}

function formatSectionsForJudge(result: AgentResult): string {
  const d = result.digest;
  const lines = [
    `Key Takeaways (ordered):\n${d.keyTakeaways.map((t, i) => `  ${i + 1}. ${t}`).join("\n")}`,
  ];
  for (const section of d.sections) {
    lines.push(`\nSection: ${section.heading}`);
    for (const [i, item] of section.items.entries()) {
      lines.push(
        `  ${i + 1}. [${item.category}] ${item.title}\n     ${item.detail}`,
      );
    }
  }
  return lines.join("\n");
}

// ── Dataset setup ───────────────────────────────────────────────────

const DATASET_NAME = "newsletter-agent-evals";

async function ensureDataset(client: Client) {
  const datasets = [];
  for await (const ds of client.listDatasets({ datasetName: DATASET_NAME })) {
    datasets.push(ds);
  }

  if (datasets.length > 0) {
    console.log(`  Using existing dataset: ${DATASET_NAME}`);
    return datasets[0];
  }

  console.log(`  Creating dataset: ${DATASET_NAME}`);
  const dataset = await client.createDataset(DATASET_NAME, {
    description:
      "Diverse newsletter inputs for evaluating the newsletter agent",
  });

  await client.createExamples({
    datasetId: dataset.id,
    inputs: EVAL_DATASET.map((e) => e.inputs),
  });

  return dataset;
}

// ── Target function ─────────────────────────────────────────────────

async function target(
  inputs: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const newsletterInput = inputs as unknown as NewsletterInput;
  console.log(`\n  Running agent for: ${newsletterInput.title}...`);

  const start = Date.now();
  const result = await runNewsletterAgent(newsletterInput);
  const durationMs = Date.now() - start;

  console.log(
    `  Done in ${(durationMs / 1000).toFixed(1)}s — ${result.digest.sections.flatMap((s) => s.items).length} stories`,
  );

  const inputStr = formatInputForJudge(newsletterInput);

  return {
    digest: formatDigestForJudge(result),
    toolLog: formatToolLogForJudge(result),
    sections: formatSectionsForJudge(result),
    inputStr,
    durationMs,
    model: result.model,
    stepCount: result.stepCount,
    toolCallCounts: result.toolCallCounts,
    tier: newsletterInput.tier ?? "free",
  };
}

// ── Evaluator wrappers ──────────────────────────────────────────────
// openevals evaluators expect { inputs, outputs } with string values.
// We format the agent results into the right shape for each judge.

function wrapEvaluator(
  name: string,
  evaluator: (args: {
    inputs: string;
    outputs: string;
  }) => Promise<{ key: string; score: number | boolean; comment?: string }>,
  getInputs: (inputs: Record<string, unknown>) => string,
  getOutputs: (outputs: Record<string, unknown>) => string,
) {
  return async ({
    inputs,
    outputs,
  }: {
    inputs: Record<string, unknown>;
    outputs: Record<string, unknown>;
  }) => {
    console.log(`    Evaluating ${name}...`);
    const result = await evaluator({
      inputs: getInputs(inputs),
      outputs: getOutputs(outputs),
    });
    console.log(`    ${name}: ${result.score}`);
    return result;
  };
}

const evaluators = [
  wrapEvaluator(
    "relevancy",
    relevancyEvaluator,
    (inputs) => formatInputForJudge(inputs as unknown as NewsletterInput),
    (outputs) => outputs.digest as string,
  ),
  wrapEvaluator(
    "accuracy",
    accuracyEvaluator,
    (inputs) => formatInputForJudge(inputs as unknown as NewsletterInput),
    (outputs) => outputs.digest as string,
  ),
  wrapEvaluator(
    "tool_usage",
    toolUsageEvaluator,
    (inputs) => {
      const ni = inputs as unknown as NewsletterInput;
      return `${formatInputForJudge(ni)}\nTier: ${ni.tier ?? "free"}`;
    },
    (outputs) => outputs.toolLog as string,
  ),
  wrapEvaluator(
    "ranking",
    rankingEvaluator,
    (inputs) => formatInputForJudge(inputs as unknown as NewsletterInput),
    (outputs) => outputs.sections as string,
  ),
  ({ outputs }: { outputs: Record<string, unknown> }) =>
    latencyEvaluator({ outputs }),
];

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  console.log("Newsletter Agent Evals\n");

  const client = new Client();
  await ensureDataset(client);

  console.log("\n  Starting evaluation run...\n");

  const results = await evaluate(target, {
    data: DATASET_NAME,
    evaluators,
    experimentPrefix: "newsletter-agent",
    maxConcurrency: 1,
  });

  console.log("\n  Evaluation complete.\n");

  // Print per-example scores
  const rows: Record<string, Record<string, number | boolean>>[] = [];
  for await (const result of results) {
    const scores: Record<string, number | boolean> = {};
    for (const res of result.evaluationResults?.results ?? []) {
      if (res.key && res.score != null) {
        scores[res.key] = res.score;
      }
    }
    const title = (result.run?.inputs as Record<string, unknown>)?.title ?? "unknown";
    rows.push({ [title as string]: scores });
  }

  for (const row of rows) {
    for (const [title, scores] of Object.entries(row)) {
      console.log(`  ${title}:`);
      for (const [key, score] of Object.entries(scores)) {
        console.log(`    ${key}: ${score}`);
      }
    }
  }

  console.log(`\n  View results in LangSmith dashboard.`);

  await client.awaitPendingTraceBatches();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
