import Perplexity from "@perplexity-ai/perplexity_ai";
import { tool } from "ai";
import { z } from "zod";
import {
  type Frequency,
  perplexityDateRange,
  serperDateRange,
} from "@/lib/date-utils";
import { checkRelevancy } from "./check-relevancy";

// ── Configuration ─────────────────────────────────────────────────────────────

type SearchProvider = "serper" | "perplexity";

const SEARCH_PROVIDER: SearchProvider =
  (process.env.SEARCH_PROVIDER as SearchProvider) ?? "serper";

/** Domains that consistently return low-quality, scraped, or SEO-farm content. */
const BLOCKED_DOMAINS = new Set([
  // SEO farms / low-quality content
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
  "makeuseof.com",
  "x.com",
  // Entertainment / pop-culture clickbait
  "buzzfeed.com",
  "screenrant.com",
  "cbr.com",
  "gamerant.com",
  "boredpanda.com",
  "dailydot.com",
  // Blog aggregators / AI news roundup sites (they summarize others' reporting)
  "devflokers.com",
  "tldl.io",
  "getaibook.com",
  "pricepertoken.com",
  "llm-stats.com",
  "promptinjection.net",
  "rtinsights.com",
  "substack.com",
  "beehiiv.com",
  "ghost.io",
  "hashnode.dev",
  "dev.to",
  // Newsletter / digest sites
  "interconnects.ai",
  "theneurondaily.com",
  "morningbrew.com",
  "techbuzz.ai",
  "tldr.tech",
  "bensbites.com",
  "therundown.ai",
  "superhuman.ai",
  "aibreakfast.com",
  "whytryai.com",
  // Aggregators / mirrors / syndication
  "msn.com",
  "news.yahoo.com",
  "news.google.com",
  "flipboard.com",
  "smartnews.com",
  "newsbreak.com",
  "ground.news",
  // Listicle / personal finance advice (not news)
  "cheapism.com",
  "nerdwallet.com",
  "moneywise.com",
  "investopedia.com",
  "fool.com",
  "bankrate.com",
  // User-generated / forums
  "reddit.com",
  "stackoverflow.com",
  "stackexchange.com",
  // Press release wires (not journalism)
  "prnewswire.com",
  "businesswire.com",
  "globenewswire.com",
  "accesswire.com",
  "prweb.com",
]);

/**
 * Domains where we block subdomains too (e.g. *.substack.com).
 * Checked via endsWith so "patmcguinness.substack.com" matches "substack.com".
 */
const BLOCKED_DOMAIN_SUFFIXES = [
  "substack.com",
  "beehiiv.com",
  "ghost.io",
  "hashnode.dev",
  "medium.com",
  "msn.com",
  "yahoo.com",
  "blogspot.com",
  "wordpress.com",
  "tumblr.com",
];

/**
 * Domains whose /blog paths are primary news sources (product announcements,
 * research papers, etc.) and should NOT be filtered by blog-path rules.
 */
const BLOG_ALLOWLISTED_DOMAINS = new Set([
  "openai.com",
  "anthropic.com",
  "deepmind.google",
  "ai.meta.com",
  "blog.google",
  "microsoft.com",
  "apple.com",
  "nvidia.com",
  "aws.amazon.com",
  "ai.google",
  "stability.ai",
  "mistral.ai",
  "x.ai",
  "inflection.ai",
  "cohere.com",
  "huggingface.co",
]);

/** URL path patterns that indicate blog/roundup/listicle content. */
const BLOG_PATH_PATTERNS = [
  /\/(blog|blogs|newsletter|newsletters|digest|roundup|recap|weekly|daily)\b/i,
  /news-roundup|news-recap|weekly-update|daily-update/i,
  /top-\d+-|best-of-|\d+-things-/i,
  /\/(sponsored|partner|branded-content|advertorial)\b/i,
];

/** Path patterns that indicate guides, how-tos, or advice (not breaking news). */
const ADVICE_PATH_PATTERNS = [
  /\/(learn|guide|guides|how-to|tutorial|tutorials|tips|advice|personal-finance)\b/i,
  /\/(listicle|list|lists|compare|vs|versus|review|reviews)\b/i,
  /\/(explained|explainer|what-is|definition|glossary|faq)\b/i,
];

// ── Shared types ──────────────────────────────────────────────────────────────

export type SearchToolContext = {
  frequency: Frequency;
  newsletterTitle: string;
  newsletterDescription?: string | null;
  keywords: string[];
  seenUrls: Set<string>;
};

type RawResult = {
  title: string;
  url: string;
  snippet: string;
  date?: string;
};

// ── URL filtering (shared across providers) ───────────────────────────────────

function isViableUrl(r: RawResult, seenUrls: Set<string>): boolean {
  if (!r.snippet?.trim() || r.snippet.trim().length < 80) return false;
  if (seenUrls.has(r.url)) return false;

  let url: URL;
  try {
    url = new URL(r.url);
  } catch {
    return false;
  }

  // Blocked domain (exact match)
  const hostname = url.hostname.replace(/^www\./, "");
  if (BLOCKED_DOMAINS.has(hostname)) return false;

  // Blocked domain (subdomain match, e.g. *.substack.com)
  if (BLOCKED_DOMAIN_SUFFIXES.some((suffix) => hostname.endsWith(`.${suffix}`)))
    return false;

  // Bare homepages
  if (url.pathname === "/" || url.pathname === "") return false;

  // Index/taxonomy pages
  if (
    /^\/(tag|tags|category|categories|author|authors|topic|topics|archive|search)\b/i.test(
      url.pathname,
    )
  )
    return false;

  const isAllowlistedBlog = BLOG_ALLOWLISTED_DOMAINS.has(hostname);

  // Blog posts, newsletters, roundups (skip check for allowlisted primary-source domains)
  if (
    !isAllowlistedBlog &&
    BLOG_PATH_PATTERNS.some((p) => p.test(url.pathname))
  )
    return false;

  // Guides, how-tos, advice content
  if (ADVICE_PATH_PATTERNS.some((p) => p.test(url.pathname))) return false;

  return true;
}

function deduplicateByTitle(results: RawResult[]): RawResult[] {
  const seen = new Set<string>();
  return results.filter((r) => {
    const normalized = r.title.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

// ── Serper provider ───────────────────────────────────────────────────────────

async function searchSerper(
  query: string,
  ctx: SearchToolContext,
): Promise<RawResult[]> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) throw new Error("SERPER_API_KEY not set");

  const tbs = serperDateRange(ctx.frequency);

  const res = await fetch("https://google.serper.dev/news", {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: query,
      num: 20,
      tbs,
      gl: "us",
      hl: "en",
    }),
  });

  if (!res.ok) {
    throw new Error(`Serper API error: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as {
    news?: { title: string; link: string; snippet: string; date?: string }[];
  };

  return (data.news ?? []).map((r) => ({
    title: r.title,
    url: r.link,
    snippet: r.snippet,
    date: r.date,
  }));
}

// ── Perplexity provider ───────────────────────────────────────────────────────

const perplexity = new Perplexity();

async function searchPerplexity(
  query: string,
  ctx: SearchToolContext,
): Promise<RawResult[]> {
  const { after, before } = perplexityDateRange(ctx.frequency);
  const topicHint = ctx.keywords.slice(0, 3).join(" ");
  const enrichedQuery = topicHint ? `${query} ${topicHint}` : query;

  const search = await perplexity.search.create({
    query: enrichedQuery,
    max_results: 5,
    search_after_date_filter: after,
    search_before_date_filter: before,
    search_domain_filter: [...BLOCKED_DOMAINS].map((d) => `-${d}`),
    search_language_filter: ["en"],
  });

  return (search.results ?? []).map((r) => ({
    title: r.title,
    url: r.url,
    snippet: r.snippet ?? "",
    date: r.date ?? undefined,
  }));
}

// ── Main search function ──────────────────────────────────────────────────────

async function webSearch(
  query: string,
  ctx: SearchToolContext,
): Promise<string> {
  const provider = SEARCH_PROVIDER;
  console.log(`[searchWeb] provider=${provider} query="${query}"`);

  try {
    const raw =
      provider === "serper"
        ? await searchSerper(query, ctx)
        : await searchPerplexity(query, ctx);

    console.log(
      `[searchWeb] query="${query}" results=${raw.length}${raw.length > 0 ? ` | top: "${raw[0].title}"` : ""}`,
    );

    if (raw.length === 0) return "No results found.";

    const viable = raw.filter((r) => isViableUrl(r, ctx.seenUrls));
    const deduped = deduplicateByTitle(viable);

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

// ── Tool export ───────────────────────────────────────────────────────────────

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
