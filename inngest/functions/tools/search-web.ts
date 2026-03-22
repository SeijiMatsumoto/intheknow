import Perplexity from "@perplexity-ai/perplexity_ai";
import { tool } from "ai";
import { z } from "zod";
import { type Frequency, perplexityDateRange } from "@/lib/frequency";
import { checkRelevancy } from "./check-relevancy";

const perplexity = new Perplexity();

export type SearchToolContext = {
  frequency: Frequency;
  newsletterTitle: string;
  newsletterDescription?: string | null;
  keywords: string[];
  seenUrls: Set<string>;
};

async function webSearch(
  query: string,
  ctx: SearchToolContext,
): Promise<string> {
  const { after, before } = perplexityDateRange(ctx.frequency);

  console.log(`[searchWeb] query="${query}" dateRange=${after}→${before}`);

  try {
    // Add newsletter keywords as context so Perplexity returns topically relevant results
    // e.g. "new model releases" → "new model releases artificial intelligence LLMs"
    const topicHint = ctx.keywords.slice(0, 3).join(" ");
    const enrichedQuery = topicHint ? `${query} ${topicHint}` : query;

    const search = await perplexity.search.create({
      query: enrichedQuery,
      max_results: 5,
      search_after_date_filter: after,
      search_before_date_filter: before,
    });

    const raw = search.results ?? [];

    console.log(
      `[searchWeb] query="${query}" results=${raw.length}${raw.length > 0 ? ` | top: "${raw[0].title}" (${raw[0].date ?? "no date"})` : ""}`,
    );

    if (raw.length === 0) return "No results found.";

    // Pre-filter obvious junk and already-seen URLs before LLM call
    const viable = raw.filter((r) => {
      if (!r.snippet?.trim()) return false;
      try {
        const path = new URL(r.url).pathname;
        if (path === "/" || path === "") return false;
      } catch {
        return false;
      }
      if (ctx.seenUrls.has(r.url)) return false;
      return true;
    });

    if (viable.length === 0)
      return `No relevant results found for: ${query}`;

    const relevancy = await checkRelevancy(
      query,
      viable.map((r) => ({ title: r.title, content: r.snippet })),
      {
        newsletterTitle: ctx.newsletterTitle,
        newsletterDescription: ctx.newsletterDescription,
      },
    );

    const results = viable
      .map((r, i) => ({
        title: r.title,
        url: r.url,
        date: r.date ?? "unknown",
        summary: relevancy[i].summary,
        relevant: relevancy[i].relevant,
      }))
      .filter((r) => r.relevant);

    // Track seen URLs to prevent duplicates across calls
    for (const r of results) {
      ctx.seenUrls.add(r.url);
    }

    console.log(
      `[searchWeb] query="${query}" raw=${raw.length} viable=${viable.length} relevant=${results.length}`,
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
      "Search the web for recent news. Use broad topic queries for discovery (e.g. 'AI model announcements') or specific queries to drill into a known story. Date and source filtering are automatic — never include dates or site: operators.",
    inputSchema: z.object({
      query: z
        .string()
        .describe(
          "2-5 word keyword query. Broad for discovery ('AI model announcements', 'tech industry layoffs') or specific for follow-up ('GPT-5 pricing details'). No dates, no site: operators.",
        ),
    }),
    execute: async ({ query }) => webSearch(query, ctx),
  });
}
