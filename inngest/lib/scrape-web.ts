import { randomUUID } from "node:crypto";
import { perplexity } from "@ai-sdk/perplexity";
import { generateText, Output } from "ai";
import { z } from "zod";
import type { CandidateItem } from "./types";

const ArticleListSchema = z.object({
  articles: z.array(
    z.object({
      title: z.string(),
      url: z.string(),
      summary: z.string(),
      source: z.string(),
      publishedAt: z.string(), // YYYY-MM-DD
    }),
  ),
});

function extractDomain(urlOrFeed: string): string {
  try {
    const u = new URL(urlOrFeed);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return urlOrFeed;
  }
}

function freshnessFromDate(isoDate: string): number {
  const pub = new Date(isoDate).getTime();
  if (Number.isNaN(pub)) return 5; // unknown → neutral
  const ageHours = (Date.now() - pub) / (1000 * 60 * 60);
  if (ageHours <= 6) return 10;
  if (ageHours <= 24) return 9;
  if (ageHours <= 48) return 7;
  if (ageHours <= 72) return 6;
  if (ageHours <= 120) return 5; // ~5 days
  if (ageHours <= 168) return 3; // ~7 days
  return 1;
}

export async function scrapeWeb(
  sources: { rss: string[]; sites: string[] },
  keywords: string[],
): Promise<CandidateItem[]> {
  if (keywords.length === 0) return [];

  const keywordStr = keywords.join(", ");

  const allSources = [...(sources.rss ?? []), ...(sources.sites ?? [])];
  const domainHints = allSources.map(extractDomain).filter(Boolean).slice(0, 6);
  const siteContext =
    domainHints.length > 0
      ? `Prioritise content from these sites when available: ${domainHints.join(", ")}. `
      : "";

  const today = new Date().toISOString().split("T")[0];

  const { output } = await generateText({
    model: perplexity("sonar"),
    experimental_output: Output.object({ schema: ArticleListSchema }),
    prompt: `Today is ${today}. You are a research assistant helping build a newsletter digest.

${siteContext}Find 10–15 real, recent articles (published within the last 7 days) about: ${keywordStr}.

For each article return:
- title: the article's headline (exact)
- url: the direct article URL (must be real and reachable)
- summary: a 2–3 sentence summary that captures the key insight, written for a newsletter reader
- source: the publication or site name (e.g. "TechCrunch", "The Verge")
- publishedAt: publication date as YYYY-MM-DD (use today's date if unknown)

Only include articles genuinely relevant to the topics above. Skip opinion pieces and press releases unless highly relevant.`,
  });

  return output.articles
    .filter((a) => a.url.startsWith("http") && a.title && a.summary)
    .map((article) => ({
      id: randomUUID(),
      title: article.title,
      url: article.url,
      content: article.summary,
      source: article.source,
      sourceType: "site" as const,
      publishedAt: article.publishedAt,
      freshnessScore: freshnessFromDate(article.publishedAt),
      worthScore: 0,
      combinedScore: 0,
    }));
}
