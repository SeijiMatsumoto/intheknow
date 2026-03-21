import { tool } from "ai";
import { z } from "zod";
import { type Frequency, twitterDateRange } from "@/lib/frequency";
import { checkRelevancyAndSummarize } from "./check-relevancy";

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

type TwitterToolContext = {
  frequency: Frequency;
  newsletterTitle: string;
  newsletterDescription?: string | null;
};

async function twitterSearch(
  queries: string[],
  ctx: TwitterToolContext,
): Promise<string> {
  const frequency = ctx.frequency;
  const apiKey = process.env.TWITTERAPI_IO_KEY;
  if (!apiKey) {
    console.warn("[searchTwitter] no API key configured");
    return `Twitter search not available (no API key). Queries attempted: ${queries.join(", ")}`;
  }

  console.log(
    `[searchTwitter] ${queries.length} queries: ${queries.join(" | ")}`,
  );

  const allTweets: Tweet[] = [];

  for (const q of queries) {
    const fullQuery = buildTwitterQuery(q, frequency);
    const url = `https://api.twitterapi.io/twitter/tweet/advanced_search?query=${encodeURIComponent(fullQuery)}&queryType=Top&count=10`;

    console.log(
      `[searchTwitter] fetching query="${q}" fullQuery="${fullQuery}"`,
    );

    const res = await fetch(url, {
      headers: { "x-api-key": apiKey },
    });

    if (!res.ok) {
      console.warn(`[searchTwitter] FAILED query="${q}" status=${res.status}`);
      continue;
    }

    const data: TwitterSearchResponse = await res.json();
    const count = data.tweets?.length ?? 0;
    allTweets.push(...(data.tweets ?? []));

    console.log(
      `[searchTwitter] query="${q}" tweets=${count}${count > 0 ? ` | top: @${data.tweets[0].author.userName} (${data.tweets[0].likeCount} likes)` : ""}`,
    );
  }

  console.log(
    `[searchTwitter] total raw=${allTweets.length} across ${queries.length} queries`,
  );

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

  // Filter for relevancy and summarize
  const combinedQuery = queries.join(", ");
  const relevancy = await checkRelevancyAndSummarize(
    combinedQuery,
    sorted.map((t) => ({
      title: `@${t.author.userName} (${t.author.name})`,
      content: t.text,
    })),
    {
      newsletterTitle: ctx.newsletterTitle,
      newsletterDescription: ctx.newsletterDescription,
    },
  );

  const relevant = sorted
    .map((t, i) => ({ tweet: t, ...relevancy[i] }))
    .filter((r) => r.relevant);

  console.log(
    `[searchTwitter] after dedup=${unique.length}, relevant=${relevant.length}, filtered=${sorted.length - relevant.length}`,
  );

  if (relevant.length === 0) {
    return `No relevant tweets found for: ${queries.join(", ")}`;
  }

  return relevant
    .map(
      (r, i) =>
        `${i + 1}. @${r.tweet.author.userName} (${r.tweet.author.name}${r.tweet.author.isBlueVerified ? " ✓" : ""}, ${r.tweet.author.followers.toLocaleString()} followers)\n   ${r.summary}\n   ${formatEngagement(r.tweet)}\n   ${r.tweet.url}\n   ${r.tweet.createdAt}`,
    )
    .join("\n\n");
}

export function makeSearchTwitterTool(ctx: TwitterToolContext) {
  return tool({
    description:
      "Search Twitter/X for public discussion, hot takes, and reactions about the newsletter topic. Returns top tweets sorted by engagement. Use focused queries to find relevant discourse.",
    inputSchema: z.object({
      queries: z
        .array(z.string())
        .max(3)
        .describe(
          "1-3 Twitter search queries. Use keywords, hashtags, or phrases. E.g. ['GPT-5 launch reactions', '#AI agents']",
        ),
    }),
    execute: async ({ queries }) => twitterSearch(queries, ctx),
  });
}
