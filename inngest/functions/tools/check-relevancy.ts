import { openai } from "@ai-sdk/openai";
import { getTracer } from "@lmnr-ai/lmnr";
import { generateText, Output } from "ai";
import { z } from "zod";

// ── Schemas ──────────────────────────────────────────────────────────────────

const FilterSchema = z.object({
  results: z.array(
    z.object({
      index: z.number().describe("0-based index of the original item."),
      relevant: z
        .boolean()
        .describe("true if the content is relevant to the search query."),
    }),
  ),
});

const SummarySchema = z.object({
  results: z.array(
    z.object({
      index: z.number().describe("0-based index of the original item."),
      summary: z
        .string()
        .describe(
          "1-2 sentence summary extracting key facts, names, and numbers.",
        ),
    }),
  ),
});

// ── Types ────────────────────────────────────────────────────────────────────

type RelevancyInput = {
  title: string;
  content: string;
};

type RelevancyContext = {
  newsletterTitle: string;
  newsletterDescription?: string | null;
};

type RelevancyResult = {
  relevant: boolean;
  summary: string;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildPrompt(
  query: string,
  items: RelevancyInput[],
  context?: RelevancyContext,
): string {
  const parts: string[] = [];

  if (context) {
    parts.push(`Newsletter: "${context.newsletterTitle}"`);
    if (context.newsletterDescription) {
      parts.push(`Description: ${context.newsletterDescription}`);
    }
    parts.push("");
  }

  parts.push(`Search query: "${query}"`);
  parts.push("");

  for (let i = 0; i < items.length; i++) {
    parts.push(`${i}. ${items[i].title}`);
    parts.push(items[i].content);
    parts.push("");
  }

  return parts.join("\n");
}

// ── Pass 1: Boolean relevancy filter ─────────────────────────────────────────

async function filterRelevant(
  query: string,
  items: RelevancyInput[],
  context?: RelevancyContext,
): Promise<boolean[]> {
  const { output, usage } = await generateText({
    model: openai("gpt-4o-mini"),
    output: Output.object({ schema: FilterSchema }),
    experimental_telemetry: {
      isEnabled: true,
      tracer: getTracer(),
      metadata: { task: "check-relevancy-filter", query, itemCount: items.length },
    },
    system: [
      "You are a strict relevance filter. Return ONLY relevance judgments, no summaries.",
      "",
      "For each numbered item, decide if it is SPECIFICALLY relevant to the search query and newsletter context.",
      "Default to NOT relevant. Only mark relevant if the item clearly adds newsworthy information.",
      "",
      "Mark as NOT relevant if ANY of these apply:",
      "- Generic template, boilerplate, or placeholder content",
      "- Lacks specific, actionable information (no concrete names, numbers, dates, or events)",
      "- Homepage, index page, or navigation page without substantive article content",
      "- Tangentially related through shared keywords but actually about a different topic",
      "- Duplicate or near-duplicate of another item in the list (keep the more detailed one)",
      "- Opinion piece or listicle with no original reporting or new information",
      "- Press release or promotional content without newsworthy substance",
    ].join("\n"),
    prompt: buildPrompt(query, items, context),
  });

  const results = output?.results ?? [];

  console.log(
    `[checkRelevancy:filter] query="${query}" relevant=${results.filter((r) => r.relevant).length}/${items.length} tokens=${usage.inputTokens}in/${usage.outputTokens}out`,
  );

  const indexed = new Map(results.map((r) => [r.index, r.relevant]));
  return items.map((_, i) => indexed.get(i) ?? false);
}

// ── Pass 2: Summarize only relevant items ────────────────────────────────────

async function summarizeRelevant(
  query: string,
  items: RelevancyInput[],
  context?: RelevancyContext,
): Promise<string[]> {
  const { output, usage } = await generateText({
    model: openai("gpt-4o-mini"),
    output: Output.object({ schema: SummarySchema }),
    experimental_telemetry: {
      isEnabled: true,
      tracer: getTracer(),
      metadata: {
        task: "check-relevancy-summarize",
        query,
        itemCount: items.length,
      },
    },
    system: [
      "You are a concise summarizer. For each numbered item, write a 1-2 sentence summary extracting only the key facts, names, and numbers.",
      "These summaries replace the raw text — make them tight and information-dense.",
    ].join("\n"),
    prompt: buildPrompt(query, items, context),
  });

  const results = output?.results ?? [];

  console.log(
    `[checkRelevancy:summarize] query="${query}" items=${items.length} tokens=${usage.inputTokens}in/${usage.outputTokens}out`,
  );

  const indexed = new Map(results.map((r) => [r.index, r.summary]));
  return items.map((_, i) => indexed.get(i) ?? "");
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Two-pass relevancy check:
 * 1. Fast boolean filter (skip irrelevant items)
 * 2. Summarize only the relevant ones (so the main agent never reads raw text)
 */
export async function checkRelevancy(
  query: string,
  items: RelevancyInput[],
  context?: RelevancyContext,
): Promise<RelevancyResult[]> {
  if (items.length === 0) return [];

  console.log(`[checkRelevancy] query="${query}" items=${items.length}`);

  // Pass 1: boolean filter
  const relevant = await filterRelevant(query, items, context);

  const relevantItems = items
    .map((item, i) => ({ item, originalIndex: i }))
    .filter((_, i) => relevant[i]);

  if (relevantItems.length === 0) {
    console.log(`[checkRelevancy] query="${query}" — nothing relevant, skipping summarize`);
    return items.map(() => ({ relevant: false, summary: "" }));
  }

  // Pass 2: summarize only relevant items
  const summaries = await summarizeRelevant(
    query,
    relevantItems.map((r) => r.item),
    context,
  );

  // Merge back into original order
  const results: RelevancyResult[] = items.map(() => ({
    relevant: false,
    summary: "",
  }));

  for (let i = 0; i < relevantItems.length; i++) {
    results[relevantItems[i].originalIndex] = {
      relevant: true,
      summary: summaries[i],
    };
  }

  return results;
}
