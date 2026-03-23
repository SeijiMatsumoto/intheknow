import { openai } from "@ai-sdk/openai";
import { getTracer } from "@lmnr-ai/lmnr";
import { generateText, Output } from "ai";
import { z } from "zod";

// ── Schema ───────────────────────────────────────────────────────────────────

const RelevancySchema = z.object({
  results: z.array(
    z.object({
      index: z.number().describe("0-based index of the original item."),
      relevant: z
        .boolean()
        .describe("true if the content is relevant to the search query."),
      summary: z
        .string()
        .describe(
          "If relevant: 1-2 sentence summary with key facts, names, and numbers. If not relevant: empty string.",
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

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Single-pass relevancy filter + summarizer.
 * Judges relevance and summarizes relevant items in one LLM call.
 */
export async function checkRelevancy(
  query: string,
  items: RelevancyInput[],
  context?: RelevancyContext,
): Promise<RelevancyResult[]> {
  if (items.length === 0) return [];

  console.log(`[checkRelevancy] query="${query}" items=${items.length}`);

  const { output, usage } = await generateText({
    model: openai("gpt-4o-mini"),
    output: Output.object({ schema: RelevancySchema }),
    experimental_telemetry: {
      isEnabled: true,
      tracer: getTracer(),
      metadata: { task: "check-relevancy", query, itemCount: items.length },
    },
    system: `You are an editorial filter for a curated newsletter. Your job is to decide what a subscriber would actually want to read.

Think like a subscriber: they signed up for "${context?.newsletterTitle ?? "this newsletter"}" because they want to stay informed on what matters in this space. They want real news — things that happened, decisions that were made, products that launched, numbers that moved. They do NOT want filler, fluff, or content that wastes their time.

For each numbered item, decide: would a subscriber be glad this was in their newsletter, or would they skip it?

If relevant: write a 1-2 sentence summary extracting the key facts, names, and numbers.
If not relevant: set summary to an empty string.

Mark as NOT relevant if ANY of these apply:
- Not something a subscriber would care about or act on
- Generic template, boilerplate, or placeholder content
- No concrete facts — no names, numbers, dates, or specific events
- Homepage, index page, or navigation page with no article content
- Tangentially related through shared keywords but actually about a different topic
- Duplicate or near-duplicate of another item (keep the more detailed one)
- Promotional content or press release without genuine news value`,
    prompt: buildPrompt(query, items, context),
  });

  const results = output?.results ?? [];
  const relevantCount = results.filter((r) => r.relevant).length;

  console.log(
    `[checkRelevancy] query="${query}" relevant=${relevantCount}/${items.length} tokens=${usage.inputTokens}in/${usage.outputTokens}out`,
  );

  const indexed = new Map(
    results.map((r) => [r.index, { relevant: r.relevant, summary: r.summary }]),
  );

  return items.map((_, i) => indexed.get(i) ?? { relevant: false, summary: "" });
}
