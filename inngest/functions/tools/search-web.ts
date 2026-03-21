import Perplexity from "@perplexity-ai/perplexity_ai";
import { tool } from "ai";
import { z } from "zod";
import { type Frequency, perplexityDateRange } from "@/lib/frequency";
import { checkRelevancyAndSummarize } from "./check-relevancy";

const perplexity = new Perplexity();

type SearchToolContext = {
  frequency: Frequency;
  newsletterTitle: string;
  newsletterDescription?: string | null;
};

async function webSearch(
  query: string,
  ctx: SearchToolContext,
): Promise<string> {
  const { after, before } = perplexityDateRange(ctx.frequency);

  console.log(`[searchWeb] query="${query}" dateRange=${after}→${before}`);

  try {
    const search = await perplexity.search.create({
      query,
      max_results: 10,
      search_after_date_filter: after,
      search_before_date_filter: before,
    });

    const raw = search.results ?? [];

    console.log(
      `[searchWeb] query="${query}" results=${raw.length}${raw.length > 0 ? ` | top: "${raw[0].title}" (${raw[0].date ?? "no date"})` : ""}`,
    );

    if (raw.length === 0) return "No results found.";

    const relevancy = await checkRelevancyAndSummarize(
      query,
      raw.map((r) => ({ title: r.title, content: r.snippet })),
      {
        newsletterTitle: ctx.newsletterTitle,
        newsletterDescription: ctx.newsletterDescription,
      },
    );

    const results = raw
      .map((r, i) => ({
        title: r.title,
        url: r.url,
        date: r.date ?? "unknown",
        summary: relevancy[i].summary,
        relevant: relevancy[i].relevant,
      }))
      .filter((r) => r.relevant);

    console.log(
      `[searchWeb] query="${query}" raw=${raw.length} relevant=${results.length} filtered=${raw.length - results.length}`,
    );

    if (results.length === 0) return `No relevant results found for: ${query}`;

    return results
      .map(
        (r, i) =>
          `${i + 1}. ${r.title}\n   URL: ${r.url}\n   Date: ${r.date}\n   ${r.summary}`,
      )
      .join("\n\n");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[searchWeb] FAILED query="${query}" error=${msg}`);
    return `Web search failed: ${msg}`;
  }
}

export function makeSearchWebTool(ctx: SearchToolContext) {
  return tool({
    description:
      "Search the web for recent articles relevant to the newsletter. Call multiple times with different angles to broaden coverage.",
    inputSchema: z.object({
      query: z.string().describe("Specific search query to look up"),
    }),
    execute: async ({ query }) => webSearch(query, ctx),
  });
}
