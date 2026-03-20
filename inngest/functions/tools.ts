import { openai } from "@ai-sdk/openai";
import { generateText, tool } from "ai";
import { z } from "zod";
import { type DigestContent, DigestSchema } from "./newsletter-agent";

// ── Sub-agents ────────────────────────────────────────────────────────────────

const RECENCY_FILTER: Record<string, string> = { daily: "day", weekly: "week" };

async function webSearchSubagent(
  query: string,
  keywords: string[],
  frequency: string,
): Promise<string> {
  const recencyFilter = RECENCY_FILTER[frequency] ?? "week";
  const today = new Date().toISOString().split("T")[0];

  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "sonar",
      search_recency_filter: recencyFilter,
      messages: [
        {
          role: "user",
          content: `Today is ${today}. Find 8-12 real, recent articles about: ${query}\n\nFor each article return the title, URL, source name, publication date (YYYY-MM-DD), and a 2-3 sentence summary. Format as a numbered list.`,
        },
      ],
    }),
  });

  if (!res.ok) return `Web search failed: ${res.status}`;

  const data = await res.json();
  const rawArticles: string = data.choices?.[0]?.message?.content ?? "";
  if (!rawArticles) return "No articles found.";

  const { text: summary } = await generateText({
    model: openai("gpt-5.4-mini"),
    prompt: `You are a research assistant helping compile a newsletter about: ${keywords.join(", ")}.

Below are raw search results. Extract and summarize the most relevant, newsworthy findings into a concise briefing (300-500 words). Include article titles, sources, dates, and URLs where available. Discard irrelevant or low-quality results.

Raw results:
${rawArticles}`,
  });

  return summary;
}

async function twitterSubagent(
  queries: string[],
  keywords: string[],
): Promise<string> {
  if (!process.env.TWITTERAPI_IO_KEY) {
    return `Twitter search not available (no API key). Queries attempted: ${queries.join(", ")}`;
  }

  const { text: summary } = await generateText({
    model: openai("gpt-5.4-mini"),
    prompt: `Summarize what Twitter/X is likely discussing about: ${keywords.join(", ")}. Note that live data is unavailable and this is a placeholder.`,
  });

  return summary;
}

// ── Tool factories ────────────────────────────────────────────────────────────

export function makeSearchWebTool(keywords: string[], frequency: string) {
  return tool({
    description:
      "Search the web for recent articles relevant to the newsletter. Call multiple times with different angles to broaden coverage.",
    inputSchema: z.object({
      query: z.string().describe("Specific search query to look up"),
    }),
    execute: async ({ query }) => webSearchSubagent(query, keywords, frequency),
  });
}

export function makeSearchTwitterTool(keywords: string[]) {
  return tool({
    description:
      "Search Twitter/X for relevant discussions, threads, and posts about the newsletter topic.",
    inputSchema: z.object({
      queries: z.array(z.string()).describe("Twitter search queries"),
    }),
    execute: async ({ queries }) => twitterSubagent(queries, keywords),
  });
}

export function makeSubmitAnswerTool(
  onSubmit: (digest: DigestContent) => void,
) {
  return tool({
    description:
      "Submit the final structured newsletter content once you have gathered enough research. This ends the research loop.",
    inputSchema: DigestSchema,
    execute: async (digest) => {
      onSubmit(digest);
      return digest;
    },
  });
}
