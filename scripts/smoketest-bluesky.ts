/**
 * Smoketest for the Bluesky search API — mirrors the actual agent search logic.
 *
 * Requires env vars:
 *   BLUESKY_IDENTIFIER  — your handle (e.g. yourname.bsky.social)
 *   BLUESKY_APP_PASSWORD — an app password from Settings > App Passwords
 *
 * Usage:
 *   npx tsx scripts/smoketest-bluesky.ts
 *   npx tsx scripts/smoketest-bluesky.ts "your custom query"
 *   npx tsx scripts/smoketest-bluesky.ts "your custom query" weekly
 */

import { subDays } from "date-fns";
import { config } from "dotenv";

config({ path: ".env.local" });

const query = process.argv[2] ?? "AI agents";
const frequency = (process.argv[3] ?? "daily") as "daily" | "weekly";
const windowDays = frequency === "daily" ? 1 : 7;

async function createSession() {
  const identifier = process.env.BLUESKY_IDENTIFIER;
  const password = process.env.BLUESKY_APP_PASSWORD;

  if (!identifier || !password) {
    console.error(
      "Missing BLUESKY_IDENTIFIER and/or BLUESKY_APP_PASSWORD env vars.\n" +
        "Set them in .env.local or export them before running this script.\n\n" +
        "To create an app password: Bluesky > Settings > App Passwords",
    );
    process.exit(1);
  }

  console.log(`[auth] authenticating as ${identifier}...`);

  const res = await fetch(
    "https://bsky.social/xrpc/com.atproto.server.createSession",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    },
  );

  if (!res.ok) {
    console.error(`[auth] FAILED: ${res.status} ${res.statusText}`);
    const body = await res.text();
    console.error(body);
    process.exit(1);
  }

  const data = await res.json();
  console.log(`[auth] authenticated as ${data.handle} (${data.did})`);
  return data.accessJwt as string;
}

async function main() {
  const accessJwt = await createSession();
  const now = new Date();
  const since = subDays(now, windowDays).toISOString();
  const until = now.toISOString();

  const params = new URLSearchParams({
    q: query,
    sort: "top",
    since,
    until,
    lang: "en",
    limit: "25",
  });

  const fetchUrl = `https://bsky.social/xrpc/app.bsky.feed.searchPosts?${params}`;

  console.log(
    `[searchBluesky] query="${query}" frequency=${frequency} window=${windowDays}d`,
  );
  console.log(`[searchBluesky] since=${since} until=${until}`);
  console.log(`[searchBluesky] fetching...`);

  const res = await fetch(fetchUrl, {
    headers: { Authorization: `Bearer ${accessJwt}` },
  });

  if (!res.ok) {
    console.error(`[searchBluesky] FAILED status=${res.status}`);
    const body = await res.text();
    console.error(body);
    process.exit(1);
  }

  const data = await res.json();
  const rawPosts = data.posts ?? [];

  console.log(`[searchBluesky] raw=${rawPosts.length}`);

  // Map to the same shape the agent uses
  const posts = rawPosts.map((p: Record<string, unknown>) => {
    const author = p.author as { handle: string; displayName?: string };
    const record = p.record as { text?: string };
    const rkey = (p.uri as string).split("/").pop();
    return {
      text: record?.text ?? "",
      likeCount: (p.likeCount as number) ?? 0,
      repostCount: (p.repostCount as number) ?? 0,
      replyCount: (p.replyCount as number) ?? 0,
      quoteCount: (p.quoteCount as number) ?? 0,
      handle: author.handle,
      displayName: author.displayName ?? author.handle,
      url: `https://bsky.app/profile/${author.handle}/post/${rkey}`,
      indexedAt: p.indexedAt as string,
    };
  });

  // Pre-filter (same as agent)
  const viable = posts.filter((p: { text: string }) => {
    if (p.text.trim().length < 30) return false;
    const stripped = p.text.replace(/[@#]\S+/g, "").trim();
    if (stripped.length < 20) return false;
    return true;
  });

  console.log(
    `[searchBluesky] viable=${viable.length} (filtered ${posts.length - viable.length} low-quality)`,
  );

  // Sort by engagement (same as agent)
  const sorted = viable
    .sort(
      (
        a: { likeCount: number; repostCount: number },
        b: { likeCount: number; repostCount: number },
      ) => b.likeCount + b.repostCount - (a.likeCount + a.repostCount),
    )
    .slice(0, 10);

  console.log(`[searchBluesky] top ${sorted.length} results:\n`);

  for (const [i, post] of sorted.entries()) {
    const text = post.text.slice(0, 140).replace(/\n/g, " ");
    console.log(`${i + 1}. @${post.handle} (${post.displayName})`);
    console.log(`   ${text}${post.text.length > 140 ? "..." : ""}`);
    console.log(
      `   ${post.likeCount} likes, ${post.repostCount} reposts, ${post.replyCount} replies`,
    );
    console.log(`   ${post.url}`);
    console.log(`   ${post.indexedAt}\n`);
  }

  if (sorted.length === 0) {
    console.log("No viable posts after filtering.");
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
