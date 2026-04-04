/**
 * Backfill embeddings for all existing DigestStory rows.
 * Skips stories that already have an embedding.
 *
 * Usage:
 *   npx tsx scripts/backfill-embed.ts
 */

import { config } from "dotenv";

config({ path: ".env.local" });

import { openai } from "@ai-sdk/openai";
import { PrismaNeon } from "@prisma/adapter-neon";
import { embedMany } from "ai";
import { PrismaClient } from "../app/generated/prisma/client";

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const EMBEDDING_MODEL = openai.embedding("text-embedding-3-small");
const BATCH_SIZE = 50;

function storyText(story: {
  title: string;
  category: string;
  detail: string;
  quote: string | null;
}): string {
  return [story.title, story.category, story.detail, story.quote]
    .filter(Boolean)
    .join("\n");
}

async function main() {
  console.log("=== Backfill: Embed Stories ===\n");

  // Get all story IDs without embeddings
  const stories = await prisma.$queryRaw<
    {
      id: string;
      title: string;
      category: string;
      detail: string;
      quote: string | null;
    }[]
  >`
    SELECT id, title, category, detail, quote
    FROM digest_stories
    WHERE embedding IS NULL
    ORDER BY id
  `;

  console.log(`Found ${stories.length} stories without embeddings.\n`);

  if (stories.length === 0) {
    console.log("Nothing to do.");
    await prisma.$disconnect();
    return;
  }

  let embedded = 0;
  let failed = 0;

  for (let i = 0; i < stories.length; i += BATCH_SIZE) {
    const batch = stories.slice(i, i + BATCH_SIZE);
    const texts = batch.map(storyText);

    try {
      const { embeddings } = await embedMany({
        model: EMBEDDING_MODEL,
        values: texts,
      });

      for (let j = 0; j < batch.length; j++) {
        const vectorStr = `[${embeddings[j].join(",")}]`;
        await prisma.$executeRaw`
          UPDATE digest_stories
          SET embedding = ${vectorStr}::vector
          WHERE id = ${batch[j].id}
        `;
      }

      embedded += batch.length;
    } catch (e) {
      console.error(`Failed batch starting at index ${i}:`, e);
      failed += batch.length;
    }

    console.log(
      `  Progress: ${embedded} embedded, ${failed} failed (${i + batch.length}/${stories.length})`,
    );
  }

  console.log(
    `\nDone: ${embedded} embedded, ${failed} failed out of ${stories.length} total.`,
  );

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
