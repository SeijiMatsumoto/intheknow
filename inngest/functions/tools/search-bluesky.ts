import { tool } from "ai";
import { z } from "zod";
import { blueskyDateRange, type Frequency } from "@/lib/frequency";
import { checkRelevancy } from "./check-relevancy";

type BlueskyAuthor = {
  handle: string;
  displayName: string;
};

type BlueskyPost = {
  uri: string;
  url: string;
  text: string;
  indexedAt: string;
  likeCount: number;
  repostCount: number;
  replyCount: number;
  quoteCount: number;
  author: BlueskyAuthor;
};

type BlueskySearchResponse = {
  posts: {
    uri: string;
    cid: string;
    author: {
      did: string;
      handle: string;
      displayName?: string;
    };
    record: { text?: string; createdAt?: string };
    likeCount?: number;
    repostCount?: number;
    replyCount?: number;
    quoteCount?: number;
    indexedAt: string;
  }[];
  cursor?: string;
  hitsTotal?: number;
};

type BlueskySession = {
  accessJwt: string;
  did: string;
};

let cachedSession: { session: BlueskySession; expiresAt: number } | null = null;

async function getSession(): Promise<BlueskySession | null> {
  const identifier = process.env.BLUESKY_IDENTIFIER;
  const password = process.env.BLUESKY_APP_PASSWORD;
  if (!identifier || !password) return null;

  // Reuse session if it's still fresh (refresh 2 min before expiry)
  if (cachedSession && Date.now() < cachedSession.expiresAt) {
    return cachedSession.session;
  }

  const res = await fetch(
    "https://bsky.social/xrpc/com.atproto.server.createSession",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    },
  );

  if (!res.ok) {
    console.warn(`[searchBluesky] auth failed: ${res.status}`);
    return null;
  }

  const data = (await res.json()) as BlueskySession;
  // Cache for 3 minutes (access tokens last ~5 min)
  cachedSession = { session: data, expiresAt: Date.now() + 3 * 60 * 1000 };
  return data;
}

function postUrl(uri: string, handle: string): string {
  // uri format: at://did:plc:xxx/app.bsky.feed.post/rkey
  const rkey = uri.split("/").pop();
  return `https://bsky.app/profile/${handle}/post/${rkey}`;
}

function formatEngagement(post: BlueskyPost): string {
  const parts: string[] = [];
  if (post.likeCount > 0)
    parts.push(`${post.likeCount.toLocaleString()} likes`);
  if (post.repostCount > 0)
    parts.push(`${post.repostCount.toLocaleString()} reposts`);
  if (post.replyCount > 0)
    parts.push(`${post.replyCount.toLocaleString()} replies`);
  return parts.join(", ") || "no engagement data";
}

export type BlueskyToolContext = {
  frequency: Frequency;
  newsletterTitle: string;
  newsletterDescription?: string | null;
};

async function blueskySearch(
  queries: string[],
  ctx: BlueskyToolContext,
): Promise<string> {
  const frequency = ctx.frequency;
  const { since, until } = blueskyDateRange(frequency);

  const session = await getSession();
  if (!session) {
    console.warn("[searchBluesky] no credentials configured");
    return `Bluesky search not available (no credentials). Queries attempted: ${queries.join(", ")}`;
  }

  console.log(
    `[searchBluesky] ${queries.length} queries: ${queries.join(" | ")}`,
  );

  const allPosts: BlueskyPost[] = [];

  const fetches = queries.map(async (q) => {
    const params = new URLSearchParams({
      q,
      sort: "top",
      since,
      until,
      lang: "en",
      limit: "25",
    });

    const fetchUrl = `https://bsky.social/xrpc/app.bsky.feed.searchPosts?${params}`;

    console.log(`[searchBluesky] fetching query="${q}"`);

    const res = await fetch(fetchUrl, {
      headers: { Authorization: `Bearer ${session.accessJwt}` },
    });

    if (!res.ok) {
      console.warn(`[searchBluesky] FAILED query="${q}" status=${res.status}`);
      return;
    }

    const data: BlueskySearchResponse = await res.json();
    const count = data.posts?.length ?? 0;

    const posts: BlueskyPost[] = (data.posts ?? []).map((p) => ({
      uri: p.uri,
      url: postUrl(p.uri, p.author.handle),
      text: p.record?.text ?? "",
      indexedAt: p.indexedAt,
      likeCount: p.likeCount ?? 0,
      repostCount: p.repostCount ?? 0,
      replyCount: p.replyCount ?? 0,
      quoteCount: p.quoteCount ?? 0,
      author: {
        handle: p.author.handle,
        displayName: p.author.displayName ?? p.author.handle,
      },
    }));

    allPosts.push(...posts);

    console.log(
      `[searchBluesky] query="${q}" posts=${count}${count > 0 ? ` | top: @${posts[0].author.handle} (${posts[0].likeCount} likes)` : ""}`,
    );
  });

  await Promise.all(fetches);

  console.log(
    `[searchBluesky] total raw=${allPosts.length} across ${queries.length} queries`,
  );

  if (allPosts.length === 0) {
    return `No posts found for: ${queries.join(", ")}`;
  }

  // Deduplicate by URI
  const seenUris = new Set<string>();
  const unique = allPosts.filter((p) => {
    if (seenUris.has(p.uri)) return false;
    seenUris.add(p.uri);
    return true;
  });

  // Pre-filters
  const viable = unique.filter((p) => {
    if (p.text.trim().length < 30) return false;
    // Skip spam: mostly hashtags or @mentions
    const stripped = p.text.replace(/[@#]\S+/g, "").trim();
    if (stripped.length < 20) return false;
    return true;
  });

  console.log(
    `[searchBluesky] unique=${unique.length} viable=${viable.length} (filtered ${unique.length - viable.length} low-quality)`,
  );

  if (viable.length === 0) {
    return `No notable posts found for: ${queries.join(", ")}`;
  }

  // Sort by engagement and take top results
  const sorted = viable
    .sort((a, b) => b.likeCount + b.repostCount - (a.likeCount + a.repostCount))
    .slice(0, 10);

  // Relevancy filter
  const combinedQuery = queries.join(", ");
  const relevancy = await checkRelevancy(
    combinedQuery,
    sorted.map((p) => ({
      title: `@${p.author.handle} (${p.author.displayName})`,
      content: p.text,
    })),
    {
      newsletterTitle: ctx.newsletterTitle,
      newsletterDescription: ctx.newsletterDescription,
    },
  );

  const relevant = sorted
    .map((p, i) => ({ post: p, summary: relevancy[i].summary }))
    .filter((_, i) => relevancy[i].relevant);

  console.log(
    `[searchBluesky] after dedup=${unique.length}, relevant=${relevant.length}, filtered=${sorted.length - relevant.length}`,
  );

  if (relevant.length === 0) {
    return `No relevant posts found for: ${queries.join(", ")}`;
  }

  return relevant
    .map(
      (r, i) =>
        `${i + 1}. @${r.post.author.handle} (${r.post.author.displayName})\n   Original: "${r.post.text}"\n   Why relevant: ${r.summary}\n   ${formatEngagement(r.post)}\n   ${r.post.url}\n   ${r.post.indexedAt}`,
    )
    .join("\n\n");
}

export function makeSearchBlueskyTool(ctx: BlueskyToolContext) {
  return tool({
    description:
      "Search Bluesky for public discussion, hot takes, and reactions about the newsletter topic. Returns top posts sorted by engagement. Use focused queries to find relevant discourse.",
    inputSchema: z.object({
      queries: z
        .array(z.string())
        .max(3)
        .describe(
          "1-3 Bluesky search queries. Use keywords, hashtags, or phrases. E.g. ['GPT-5 launch reactions', '#AI agents']",
        ),
    }),
    execute: async ({ queries }) => blueskySearch(queries, ctx),
  });
}
