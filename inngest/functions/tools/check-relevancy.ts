import { openai } from "@ai-sdk/openai";
import * as ai from "ai";
import { Output } from "ai";
import {
  createLangSmithProviderOptions,
  wrapAISDK,
} from "langsmith/experimental/vercel";

const { generateText } = wrapAISDK(ai);

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
    providerOptions: {
      langsmith: createLangSmithProviderOptions({
        metadata: { task: "check-relevancy", query, itemCount: items.length },
      }),
    },
    system: `You are an editorial filter for a curated newsletter. Your job is to decide what a subscriber would actually want to read.

Think like a subscriber: they signed up for "${context?.newsletterTitle ?? "this newsletter"}" because they want to stay informed on what matters in this space. They want real news — things that happened, decisions that were made, products that launched, numbers that moved.

IMPORTANT: When in doubt, mark as relevant. It is much worse to filter out a major story than to let a borderline one through. The newsletter editor (a later step) will make final inclusion decisions — your job is to avoid losing important stories, not to be maximally selective.

For each numbered item, decide: could this plausibly belong in the newsletter?

If relevant: write a 1-2 sentence summary extracting the key facts, names, and numbers.
If not relevant: set summary to an empty string.

Mark as NOT relevant ONLY if it clearly falls into one of these categories:
- Generic template, boilerplate, or placeholder content with no real information
- Homepage, index page, or navigation page with no article content
- Completely unrelated topic (not just tangential — genuinely about a different field)
- Duplicate or near-duplicate of another item (keep the more detailed one)
- Pure promotional content with zero news value`,
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

  return items.map(
    (_, i) => indexed.get(i) ?? { relevant: false, summary: "" },
  );
}
