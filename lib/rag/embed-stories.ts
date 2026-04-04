import { openai } from "@ai-sdk/openai";
import { embedMany } from "ai";
import { prisma } from "@/lib/prisma";

const EMBEDDING_MODEL = openai.embedding("text-embedding-3-small");

/** Build the text to embed for a story. */
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

/**
 * Generate and store embeddings for a batch of DigestStory rows.
 * Skips stories that already have an embedding.
 */
export async function embedDigestStories(
  storyIds: string[],
): Promise<{ embedded: number; skipped: number }> {
  if (storyIds.length === 0) return { embedded: 0, skipped: 0 };

  const stories = await prisma.digestStory.findMany({
    where: { id: { in: storyIds } },
    select: {
      id: true,
      title: true,
      category: true,
      detail: true,
      quote: true,
    },
  });

  if (stories.length === 0) return { embedded: 0, skipped: 0 };

  // Check which stories already have embeddings
  const withEmbeddings = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM digest_stories
    WHERE id = ANY(${storyIds})
      AND embedding IS NOT NULL
  `;
  const alreadyEmbedded = new Set(withEmbeddings.map((r) => r.id));

  const toEmbed = stories.filter((s) => !alreadyEmbedded.has(s.id));
  if (toEmbed.length === 0) return { embedded: 0, skipped: stories.length };

  const texts = toEmbed.map(storyText);

  const { embeddings } = await embedMany({
    model: EMBEDDING_MODEL,
    values: texts,
  });

  // Store embeddings via raw SQL (Prisma doesn't support vector type natively)
  for (let i = 0; i < toEmbed.length; i++) {
    const vectorStr = `[${embeddings[i].join(",")}]`;
    await prisma.$executeRaw`
      UPDATE digest_stories
      SET embedding = ${vectorStr}::vector
      WHERE id = ${toEmbed[i].id}
    `;
  }

  return { embedded: toEmbed.length, skipped: alreadyEmbedded.size };
}
