/**
 * Validate that the backfill from JSON to normalized tables is complete.
 * Checks every DigestRun with content and verifies story counts + titles match.
 *
 * Exits with code 1 if any mismatches are found — do NOT drop JSON columns
 * until this passes cleanly.
 *
 * Usage:
 *   npx tsx scripts/validate-backfill.ts
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
  sources?: { url: string }[];
  url?: string;
};

type OldDigestContent = {
  editionTitle?: string;
  title?: string;
  summary?: string;
  sections?: { heading: string; items?: OldDigestItem[] }[];
  socialConsensus?: {
    highlights?: unknown[];
  } | null;
};

async function main() {
  console.log("=== Validate Backfill ===\n");

  const runs = await prisma.digestRun.findMany({
    where: { content: { not: Prisma.JsonNull } },
    select: { id: true, content: true, status: true },
  });

  let checked = 0;
  let noSections = 0;
  const mismatches: string[] = [];

  for (const run of runs) {
    const content = run.content as unknown as OldDigestContent;
    if (!content.sections) continue;

    // Count stories in JSON
    const jsonStoryCount = content.sections.reduce(
      (sum, s) => sum + (s.items?.length ?? 0),
      0,
    );

    // Count sections in JSON
    const jsonSectionCount = content.sections.length;

    // Count in normalized tables
    const dbSections = await prisma.digestSection.findMany({
      where: { runId: run.id },
      include: {
        stories: {
          include: { sources: true },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    const dbSectionCount = dbSections.length;
    const dbStoryCount = dbSections.reduce(
      (sum, s) => sum + s.stories.length,
      0,
    );

    if (dbSectionCount === 0 && jsonSectionCount > 0) {
      noSections++;
      mismatches.push(
        `Run ${run.id} (${run.status}): no normalized sections (JSON has ${jsonSectionCount} sections, ${jsonStoryCount} stories)`,
      );
      continue;
    }

    // Check section count
    if (jsonSectionCount !== dbSectionCount) {
      mismatches.push(
        `Run ${run.id}: section count mismatch — JSON ${jsonSectionCount}, DB ${dbSectionCount}`,
      );
    }

    // Check story count
    if (jsonStoryCount !== dbStoryCount) {
      mismatches.push(
        `Run ${run.id}: story count mismatch — JSON ${jsonStoryCount}, DB ${dbStoryCount}`,
      );
    }

    // Spot-check: first story title
    const firstJsonTitle = content.sections[0]?.items?.[0]?.title;
    const firstDbTitle = dbSections[0]?.stories[0]?.title;
    if (firstJsonTitle && firstDbTitle && firstJsonTitle !== firstDbTitle) {
      mismatches.push(
        `Run ${run.id}: first story title mismatch — JSON "${firstJsonTitle}" vs DB "${firstDbTitle}"`,
      );
    }

    // Spot-check: section headings
    for (let i = 0; i < Math.min(jsonSectionCount, dbSectionCount); i++) {
      const jsonHeading = content.sections[i].heading;
      const dbHeading = dbSections[i].heading;
      if (jsonHeading !== dbHeading) {
        mismatches.push(
          `Run ${run.id}: section ${i} heading mismatch — JSON "${jsonHeading}" vs DB "${dbHeading}"`,
        );
      }
    }

    // Check source counts per story
    for (let si = 0; si < Math.min(jsonSectionCount, dbSectionCount); si++) {
      const jsonItems = content.sections[si].items ?? [];
      const dbStories = dbSections[si].stories;
      for (let ii = 0; ii < Math.min(jsonItems.length, dbStories.length); ii++) {
        const jsonItem = jsonItems[ii];
        const jsonSourceCount = jsonItem.sources?.length ?? (jsonItem.url ? 1 : 0);
        const dbSourceCount = dbStories[ii].sources.length;
        if (jsonSourceCount !== dbSourceCount) {
          mismatches.push(
            `Run ${run.id}: story "${jsonItem.title}" source count mismatch — JSON ${jsonSourceCount}, DB ${dbSourceCount}`,
          );
        }
      }
    }

    checked++;
  }

  // Validate newsletter sources
  const newsletters = await prisma.newsletter.findMany({
    select: { id: true, title: true, sources: true },
  });

  let nlChecked = 0;
  for (const nl of newsletters) {
    const sources = nl.sources as {
      rss?: string[];
      sites?: string[];
      bluesky_queries?: string[];
    } | null;

    const jsonCount =
      (sources?.rss?.length ?? 0) +
      (sources?.sites?.length ?? 0) +
      (sources?.bluesky_queries?.length ?? 0);

    const dbCount = await prisma.newsletterSource.count({
      where: { newsletterId: nl.id },
    });

    if (jsonCount !== dbCount) {
      mismatches.push(
        `Newsletter "${nl.title}" (${nl.id}): source count mismatch — JSON ${jsonCount}, DB ${dbCount}`,
      );
    }
    nlChecked++;
  }

  console.log(`Checked ${checked} digest runs, ${nlChecked} newsletters.`);

  if (noSections > 0) {
    console.log(`${noSections} run(s) have no normalized sections yet.`);
  }

  if (mismatches.length > 0) {
    console.error(
      `\n${mismatches.length} MISMATCH(ES) FOUND — do NOT drop JSON columns:\n`,
    );
    for (const m of mismatches) {
      console.error(`  ${m}`);
    }
    process.exit(1);
  } else {
    console.log("\nAll clear — safe to proceed with dropping JSON columns.");
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
