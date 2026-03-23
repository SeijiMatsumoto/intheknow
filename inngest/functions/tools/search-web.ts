import Perplexity from "@perplexity-ai/perplexity_ai";
import { tool } from "ai";
import { z } from "zod";
import { type Frequency, perplexityDateRange } from "@/lib/frequency";
import { checkRelevancy } from "./check-relevancy";

const perplexity = new Perplexity();

/** Domains that consistently return low-quality, scraped, or SEO-farm content. */
const BLOCKED_DOMAINS = [
  "medium.com",
  "hubspot.com",
  "about.com",
  "ehow.com",
  "wikihow.com",
  "quora.com",
  "pinterest.com",
  "slideshare.net",
  "scribd.com",
  "issuu.com",
  "buzzfeed.com",
  "screenrant.com",
  "cbr.com",
  "gamerant.com",
  "makeuseof.com",
  "x.com",
];

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
      search_domain_filter: BLOCKED_DOMAINS.map((d) => `-${d}`),
      search_language_filter: ["en"],
    });

    const raw = search.results ?? [];

    console.log(
      `[searchWeb] query="${query}" results=${raw.length}${raw.length > 0 ? ` | top: "${raw[0].title}" (${raw[0].date ?? "no date"})` : ""}`,
    );

    if (raw.length === 0) return "No results found.";

    // Pre-filter obvious junk before LLM call
    const viable = raw.filter((r) => {
      // Empty or too-short snippets are useless
      if (!r.snippet?.trim() || r.snippet.trim().length < 80) return false;

      // Already seen this URL
      if (ctx.seenUrls.has(r.url)) return false;

      let url: URL;
      try {
        url = new URL(r.url);
      } catch {
        return false;
      }

      // Bare homepages
      if (url.pathname === "/" || url.pathname === "") return false;

      // Index/taxonomy pages — not real articles
      if (
        /^\/(tag|tags|category|categories|author|authors|topic|topics|archive|search)\b/i.test(
          url.pathname,
        )
      )
        return false;

      return true;
    });

    // Deduplicate near-identical titles (keep first occurrence)
    const seenTitles = new Set<string>();
    const deduped = viable.filter((r) => {
      const normalized = r.title.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (seenTitles.has(normalized)) return false;
      seenTitles.add(normalized);
      return true;
    });

    // Track ALL viable URLs immediately — prevents re-filtering in later searches
    for (const r of deduped) {
      ctx.seenUrls.add(r.url);
    }

    if (deduped.length === 0) return `No relevant results found for: ${query}`;

    const relevancy = await checkRelevancy(
      query,
      deduped.map((r) => ({ title: r.title, content: r.snippet })),
      {
        newsletterTitle: ctx.newsletterTitle,
        newsletterDescription: ctx.newsletterDescription,
      },
    );

    const results = deduped
      .map((r, i) => ({
        title: r.title,
        url: r.url,
        date: r.date ?? "unknown",
        summary: relevancy[i].summary,
        relevant: relevancy[i].relevant,
      }))
      .filter((r) => r.relevant);

    console.log(
      `[searchWeb] query="${query}" raw=${raw.length} viable=${deduped.length} relevant=${results.length}`,
    );

    if (results.length === 0) return `No relevant results found for: ${query}`;

    const lines = results.map(
      (r, i) =>
        `${i + 1}. ${r.title}\n   URL: ${r.url}\n   Date: ${r.date}\n   ${r.summary}`,
    );

    lines.push(
      `\n---\nSearch coverage: ${ctx.seenUrls.size} unique sources found across all searches so far.`,
    );

    return lines.join("\n\n");
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
