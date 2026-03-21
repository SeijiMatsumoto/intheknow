import { tool } from "ai";
import { z } from "zod";
import { type Frequency, perplexityDateRange } from "@/lib/frequency";

type SearchResult = {
  title: string;
  url: string;
  snippet: string;
  date: string;
  last_updated: string;
};

async function webSearch(query: string, frequency: Frequency): Promise<string> {
  const { after, before } = perplexityDateRange(frequency);

  const res = await fetch("https://api.perplexity.ai/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      max_results: 10,
      search_after_date_filter: after,
      search_before_date_filter: before,
    }),
  });

  if (!res.ok) return `Web search failed: ${res.status}`;

  const data = await res.json();
  const results: SearchResult[] = data.results ?? [];
  if (results.length === 0) return "No results found.";

  return results
    .map(
      (r, i) =>
        `${i + 1}. ${r.title}\n   URL: ${r.url}\n   Date: ${r.date}\n   ${r.snippet}`,
    )
    .join("\n\n");
}

export function makeSearchWebTool(frequency: Frequency) {
  return tool({
    description:
      "Search the web for recent articles relevant to the newsletter. Call multiple times with different angles to broaden coverage.",
    inputSchema: z.object({
      query: z.string().describe("Specific search query to look up"),
    }),
    execute: async ({ query }) => webSearch(query, frequency),
  });
}
