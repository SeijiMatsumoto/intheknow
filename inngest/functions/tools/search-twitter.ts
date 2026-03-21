import { tool } from "ai";
import { z } from "zod";
import { type Frequency, twitterDateRange } from "@/lib/frequency";

type TweetAuthor = {
  userName: string;
  name: string;
  followers: number;
  isBlueVerified: boolean;
};

type Tweet = {
  id: string;
  url: string;
  text: string;
  createdAt: string;
  likeCount: number;
  retweetCount: number;
  replyCount: number;
  quoteCount: number;
  viewCount: number;
  author: TweetAuthor;
};

type TwitterSearchResponse = {
  tweets: Tweet[];
  has_next_page: boolean;
  next_cursor: string;
};

function formatEngagement(tweet: Tweet): string {
  const parts: string[] = [];
  if (tweet.likeCount > 0)
    parts.push(`${tweet.likeCount.toLocaleString()} likes`);
  if (tweet.retweetCount > 0)
    parts.push(`${tweet.retweetCount.toLocaleString()} RTs`);
  if (tweet.viewCount > 0)
    parts.push(`${tweet.viewCount.toLocaleString()} views`);
  return parts.join(", ") || "no engagement data";
}

/** Build a Twitter advanced search query string with a date window. */
function buildTwitterQuery(query: string, frequency: Frequency): string {
  const { since, until } = twitterDateRange(frequency);
  return `${query} since:${since} until:${until} -filter:replies`;
}

async function twitterSearch(
  queries: string[],
  frequency: Frequency,
): Promise<string> {
  const apiKey = process.env.TWITTERAPI_IO_KEY;
  if (!apiKey) {
    return `Twitter search not available (no API key). Queries attempted: ${queries.join(", ")}`;
  }

  const allTweets: Tweet[] = [];

  for (const q of queries) {
    const fullQuery = buildTwitterQuery(q, frequency);
    const url = `https://api.twitterapi.io/twitter/tweet/advanced_search?query=${encodeURIComponent(fullQuery)}&queryType=Top`;

    const res = await fetch(url, {
      headers: { "x-api-key": apiKey },
    });

    if (!res.ok) continue;

    const data: TwitterSearchResponse = await res.json();
    if (data.tweets?.length) {
      allTweets.push(...data.tweets);
    }
  }

  if (allTweets.length === 0) {
    return `No tweets found for: ${queries.join(", ")}`;
  }

  // Deduplicate by tweet ID
  const seen = new Set<string>();
  const unique = allTweets.filter((t) => {
    if (seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
  });

  // Sort by engagement (likes + RTs) and take top results
  const sorted = unique
    .sort(
      (a, b) => b.likeCount + b.retweetCount - (a.likeCount + a.retweetCount),
    )
    .slice(0, 20);

  return sorted
    .map(
      (t, i) =>
        `${i + 1}. @${t.author.userName} (${t.author.name}${t.author.isBlueVerified ? " ✓" : ""}, ${t.author.followers.toLocaleString()} followers)\n   ${t.text.slice(0, 280)}\n   ${formatEngagement(t)}\n   ${t.url}\n   ${t.createdAt}`,
    )
    .join("\n\n");
}

export function makeSearchTwitterTool(frequency: Frequency) {
  return tool({
    description:
      "Search Twitter/X for public discussion, hot takes, and reactions about the newsletter topic. Returns top tweets sorted by engagement. Use focused queries to find relevant discourse.",
    inputSchema: z.object({
      queries: z
        .array(z.string())
        .describe(
          "Twitter search queries. Use keywords, hashtags, or phrases. E.g. ['GPT-5 launch reactions', '#AI agents']",
        ),
    }),
    execute: async ({ queries }) => twitterSearch(queries, frequency),
  });
}
