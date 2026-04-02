import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { Client } from "langsmith";
import { traceable } from "langsmith/traceable";
import {
  runNewsletterAgent,
  type ToolCallLog,
} from "@/inngest/functions/newsletter-agent";
import { renderEmail } from "@/inngest/lib/render-email";
import type { Frequency } from "@/lib/date-utils";

// ── Config ───────────────────────────────────────────────────────────────────

const newsletter = {
  title: "AI & LLMs Weekly",
  description:
    "A weekly digest of the latest AI agent frameworks, LLM releases, and practical tooling for engineers.",
  frequency: "weekly" as Frequency,
  keywords: [
    "AI agents",
    "LLMs",
    "OpenAI",
    "Anthropic",
    "RAG",
    "function calling",
  ],
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const DIVIDER = "─".repeat(72);
const SECTION = (label: string) =>
  `\n${"═".repeat(72)}\n  ${label}\n${"═".repeat(72)}`;

function truncate(text: string, max = 300): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}… [+${text.length - max} chars]`;
}

function formatToolCall(tc: ToolCallLog): string {
  const lines: string[] = [];
  lines.push(`  [step ${tc.stepNumber}] ${tc.toolName}()`);

  // Args
  const args =
    typeof tc.args === "object"
      ? JSON.stringify(tc.args, null, 2)
      : String(tc.args);
  lines.push(`    args: ${truncate(args, 200)}`);

  // Result
  const result =
    typeof tc.result === "string"
      ? tc.result
      : JSON.stringify(tc.result, null, 2);
  lines.push(`    result: ${truncate(result, 400)}`);

  return lines.join("\n");
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const start = Date.now();
  const runId = randomUUID();

  const wrappedRun = traceable(
    async () => {
      console.log(`\n  🔗 LangSmith run ID: ${runId}\n`);
      console.log(SECTION("NEWSLETTER AGENT SMOKE TEST"));
      console.log(`  Newsletter:  ${newsletter.title}`);
      console.log(`  Frequency:   ${newsletter.frequency}`);
      console.log(`  Keywords:    ${newsletter.keywords.join(", ")}`);
      console.log(`  Started:     ${new Date().toISOString()}`);
      console.log(DIVIDER);

      return runNewsletterAgent(newsletter);
    },
    { name: "smoketest/newsletter-agent", id: runId },
  );

  const result = await wrappedRun();

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  // ── Tool call trace ──────────────────────────────────────────────────────

  console.log(SECTION("TOOL CALL TRACE"));
  for (const tc of result.toolCallLog) {
    console.log(formatToolCall(tc));
    console.log(DIVIDER);
  }

  // ── Metadata ─────────────────────────────────────────────────────────────

  console.log(SECTION("METADATA"));
  console.log(`  Model:       ${result.model}`);
  console.log(`  Steps:       ${result.stepCount}`);
  console.log(`  Tokens in:   ${result.usage.inputTokens.toLocaleString()}`);
  console.log(`  Tokens out:  ${result.usage.outputTokens.toLocaleString()}`);
  console.log(`  Tool calls:  ${JSON.stringify(result.toolCallCounts)}`);
  console.log(`  Duration:    ${elapsed}s`);

  // ── Digest output ────────────────────────────────────────────────────────

  console.log(SECTION("DIGEST OUTPUT"));
  console.log(`  Title:       ${result.digest.editionTitle}`);
  console.log(`  Summary:     ${result.digest.summary}`);
  console.log(`\n  Key takeaways:`);
  for (const t of result.digest.keyTakeaways) {
    console.log(`    • ${t}`);
  }

  for (const section of result.digest.sections) {
    console.log(`\n  ┌─ ${section.heading} (${section.items.length} items)`);
    for (const item of section.items) {
      console.log(`  │`);
      console.log(`  ├─ ${item.title}`);
      console.log(`  │  detail: ${truncate(item.detail, 200)}`);
      if (item.quote) console.log(`  │  quote: "${truncate(item.quote, 150)}"`);
      for (const src of item.sources) {
        console.log(`  │  src: ${src.name} (${src.publishedAt}) → ${src.url}`);
      }
    }
    console.log(`  └─`);
  }

  if (result.digest.socialConsensus) {
    console.log(`\n  Social consensus:`);
    console.log(`    ${result.digest.socialConsensus.overview}`);
    for (const h of result.digest.socialConsensus.highlights) {
      console.log(
        `    • ${h.authorName} (${h.author}): "${truncate(h.text, 120)}"`,
      );
    }
  }

  console.log(`\n  Bottom line: ${result.digest.bottomLine}`);
  console.log(`\n  Agent summary: ${result.digest.agentSummary}`);

  // ── Write outputs ────────────────────────────────────────────────────────

  const outDir = resolve("scripts/smoketests/output");
  mkdirSync(outDir, { recursive: true });

  // HTML email
  const html = await renderEmail(result.digest, newsletter.title);
  const htmlPath = resolve(outDir, "newsletter-agent.html");
  writeFileSync(htmlPath, html, "utf-8");

  // Full JSON dump for offline analysis
  const jsonPath = resolve(outDir, "newsletter-agent.json");
  writeFileSync(jsonPath, JSON.stringify(result, null, 2), "utf-8");

  console.log(SECTION("OUTPUT FILES"));
  console.log(`  HTML:  ${htmlPath}`);
  console.log(`  JSON:  ${jsonPath}`);

  // Flush telemetry before exit
  const client = new Client();
  await client.awaitPendingTraceBatches();
  console.log("");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
