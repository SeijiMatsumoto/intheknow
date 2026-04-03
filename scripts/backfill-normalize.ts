/**
 * Backfill normalized digest tables from DigestRun.content JSON
 * and Newsletter.sources JSON.
 *
 * Idempotent — skips runs/newsletters that already have normalized data.
 * Safe to re-run if it crashes partway through.
 *
 * Usage:
 *   npx tsx scripts/backfill-normalize.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaNeon } from "@prisma/adapter-neon";
import { Prisma, PrismaClient } from "../app/generated/prisma/client";

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

type OldDigestItem = {
  title: string;
  category?: string;
  icon?: string;
  detail?: string;
  quote?: string | null;
  sources?: { url: string; name: string; publishedAt?: string }[];
  // Old schema compat
  url?: string;
  source?: string;
  publishedAt?: string;
};

type OldDigestContent = {
  editionTitle?: string;
  title?: string;
  summary?: string;
  keyTakeaways?: string[];
  sections?: { heading: string; items?: OldDigestItem[] }[];
  socialConsensus?: {
    overview?: string;
    highlights?: {
      text: string;
      author: string;
      authorName: string;
      url: string;
      engagement?: string | null;
    }[];
  } | null;
  bottomLine?: string;
  agentSummary?: string;
  skipEdition?: boolean;
};

const BATCH_SIZE = 50;

async function backfillDigestRuns() {
  console.log("Backfilling digest runs...\n");

  let cursor: string | undefined;
  let backfilled = 0;
  let skipped = 0;
  let failed = 0;

  while (true) {
    const runs = await prisma.digestRun.findMany({
      where: { content: { not: Prisma.JsonNull } },
      orderBy: { id: "asc" },
      take: BATCH_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      select: { id: true, content: true },
    });

    if (runs.length === 0) break;
    cursor = runs[runs.length - 1].id;

    for (const run of runs) {
      // Skip if already backfilled
      const existing = await prisma.digestSection.findFirst({
        where: { runId: run.id },
      });
      if (existing) {
        skipped++;
        continue;
      }

      try {
        const content = run.content as unknown as OldDigestContent;

        await prisma.$transaction(async (tx) => {
          // Update scalar columns on DigestRun
          await tx.digestRun.update({
            where: { id: run.id },
            data: {
              editionTitle: content.editionTitle ?? content.title ?? null,
              summary: content.summary ?? null,
              keyTakeaways: content.keyTakeaways ?? [],
              socialConsensusOverview:
                content.socialConsensus?.overview ?? null,
              bottomLine: content.bottomLine ?? null,
              agentSummary: content.agentSummary ?? null,
              skipEdition: content.skipEdition ?? false,
            },
          });

          // Create sections + stories + sources
          for (const [si, section] of (content.sections ?? []).entries()) {
            const sec = await tx.digestSection.create({
              data: {
                runId: run.id,
                heading: section.heading,
                sortOrder: si,
              },
            });

            for (const [ii, item] of (section.items ?? []).entries()) {
              // Handle old schema (item.url/item.source) vs new (item.sources[])
              const sources =
                item.sources && item.sources.length > 0
                  ? item.sources
                  : item.url
                    ? [
                        {
                          url: item.url,
                          name: item.source ?? "Source",
                          publishedAt: item.publishedAt,
                        },
                      ]
                    : [];

              const story = await tx.digestStory.create({
                data: {
                  sectionId: sec.id,
                  title: item.title,
                  category: item.category ?? "",
                  icon: item.icon ?? "flame",
                  detail: item.detail ?? "",
                  quote: item.quote ?? null,
                  sortOrder: ii,
                },
              });

              for (const [srcIdx, source] of sources.entries()) {
                await tx.digestStorySource.create({
                  data: {
                    storyId: story.id,
                    url: source.url,
                    name: source.name,
                    publishedAt: source.publishedAt ?? null,
                    sortOrder: srcIdx,
                  },
                });
              }
            }
          }

          // Create social highlights
          if (content.socialConsensus?.highlights) {
            for (const [
              i,
              h,
            ] of content.socialConsensus.highlights.entries()) {
              await tx.digestSocialHighlight.create({
                data: {
                  runId: run.id,
                  text: h.text,
                  author: h.author,
                  authorName: h.authorName,
                  url: h.url,
                  engagement: h.engagement ?? null,
                  sortOrder: i,
                },
              });
            }
          }
        });

        backfilled++;
      } catch (e) {
        console.error(`Failed to backfill run ${run.id}:`, e);
        failed++;
      }
    }

    console.log(
      `  Progress: ${backfilled} backfilled, ${skipped} skipped, ${failed} failed`,
    );
  }

  console.log(
    `\nDigest runs done: ${backfilled} backfilled, ${skipped} already done, ${failed} failed.`,
  );
  return failed;
}

async function backfillNewsletterSources() {
  console.log("\nBackfilling newsletter sources...\n");

  let backfilled = 0;
  let skipped = 0;

  const newsletters = await prisma.newsletter.findMany({
    select: { id: true, sources: true },
  });

  for (const nl of newsletters) {
    // Skip if already backfilled
    const existing = await prisma.newsletterSource.findFirst({
      where: { newsletterId: nl.id },
    });

    const sources = nl.sources as {
      rss?: string[];
      sites?: string[];
      bluesky_queries?: string[];
    } | null;

    const rss = sources?.rss ?? [];
    const sites = sources?.sites ?? [];
    const blueskyQueries = sources?.bluesky_queries ?? [];

    // Skip if already backfilled OR if there are no sources to create
    if (existing || (rss.length === 0 && sites.length === 0 && blueskyQueries.length === 0)) {
      skipped++;
      continue;
    }

    await prisma.newsletterSource.createMany({
      data: [
        ...rss.map((url) => ({ newsletterId: nl.id, type: "rss" as const, url })),
        ...sites.map((url) => ({ newsletterId: nl.id, type: "site" as const, url })),
        ...blueskyQueries.map((url) => ({ newsletterId: nl.id, type: "bluesky_query" as const, url })),
      ],
    });

    backfilled++;
  }

  console.log(
    `Newsletter sources done: ${backfilled} backfilled, ${skipped} skipped.`,
  );
}

async function main() {
  console.log("=== Backfill: Normalize Digest Content ===\n");

  const digestFailed = await backfillDigestRuns();
  await backfillNewsletterSources();

  console.log("\n=== Backfill complete ===");

  if (digestFailed > 0) {
    console.error(`\n${digestFailed} digest run(s) failed — re-run to retry.`);
    process.exit(1);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
