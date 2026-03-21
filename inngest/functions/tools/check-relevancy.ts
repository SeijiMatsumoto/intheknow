import { openai } from "@ai-sdk/openai";
import { getTracer } from "@lmnr-ai/lmnr";
import { generateText, Output } from "ai";
import { z } from "zod";

const ResultSchema = z.object({
  results: z.array(
    z.object({
      index: z.number().describe("0-based index of the original item."),
      relevant: z
        .boolean()
        .describe("true if the content is relevant to the search query."),
      summary: z
        .string()
        .describe(
          "2-3 sentence summary focused on what matters relative to the query. Empty string if not relevant.",
        ),
    }),
  ),
});

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

/**
 * Check relevancy and summarize a batch of search results in one LLM call.
 * Works for both web search snippets and tweets.
 */
export async function checkRelevancyAndSummarize(
  query: string,
  items: RelevancyInput[],
  context?: RelevancyContext,
): Promise<RelevancyResult[]> {
  if (items.length === 0) return [];

  console.log(`[checkRelevancy] query="${query}" items=${items.length}`);

  const { output, usage } = await generateText({
    model: openai("gpt-5.4-nano"),
    output: Output.object({ schema: ResultSchema }),
    experimental_telemetry: {
      isEnabled: true,
      tracer: getTracer(),
      metadata: { task: "check-relevancy", query, itemCount: items.length },
    },
    system: [
      "You are a relevance filter and summarizer.",
      "",
      "For each numbered item below:",
      "1. Determine if it is relevant to the search query and newsletter context.",
      "2. If relevant, write a concise 2-3 sentence summary focused on what matters.",
      "3. If NOT relevant, set relevant to false and summary to an empty string.",
    ].join("\n"),
    prompt: buildPrompt(query, items, context),
  });

  const results = output?.results ?? [];
  const relevant = results.filter((r) => r.relevant).length;

  console.log(
    `[checkRelevancy] query="${query}" relevant=${relevant}/${items.length} tokens=${usage.inputTokens}in/${usage.outputTokens}out`,
  );

  const indexed = new Map(results.map((r) => [r.index, r]));

  return items.map((_, i) => {
    const r = indexed.get(i);
    return r
      ? { relevant: r.relevant, summary: r.summary }
      : { relevant: false, summary: "" };
  });
}
