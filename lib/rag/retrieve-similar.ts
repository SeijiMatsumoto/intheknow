import { openai } from "@ai-sdk/openai";
import { embed } from "ai";
import { prisma } from "@/lib/prisma";

const EMBEDDING_MODEL = openai.embedding("text-embedding-3-small");

export type PriorStory = {
  title: string;
  detail: string;
  category: string;
  similarity: number;
  daysAgo: number;
};

/**
 * Retrieve stories from prior digests that are semantically similar
 * to the given query text (typically the newsletter's keywords + title).
 */
export async function retrieveSimilarStories({
  newsletterId,
  queryText,
  lookbackDays = 30,
  topK = 20,
  threshold = 0.82,
}: {
  newsletterId: string;
  queryText: string;
  lookbackDays?: number;
  topK?: number;
  threshold?: number;
}): Promise<PriorStory[]> {
  const { embedding } = await embed({
    model: EMBEDDING_MODEL,
    value: queryText,
  });

  const vectorStr = `[${embedding.join(",")}]`;

  const results = await prisma.$queryRaw<PriorStory[]>`
    SELECT
      ds.title,
      ds.detail,
      ds.category,
      (1 - (ds.embedding <=> ${vectorStr}::vector))::float AS similarity,
      EXTRACT(DAY FROM NOW() - dr.run_at)::int AS "daysAgo"
    FROM digest_stories ds
    JOIN digest_sections dsec ON ds.section_id = dsec.id
    JOIN digest_runs dr ON dsec.run_id = dr.id
    WHERE dr.newsletter_id = ${newsletterId}
      AND dr.status = 'sent'
      AND dr.run_at > NOW() - (${lookbackDays} || ' days')::interval
      AND ds.embedding IS NOT NULL
      AND (1 - (ds.embedding <=> ${vectorStr}::vector)) > ${threshold}
    ORDER BY ds.embedding <=> ${vectorStr}::vector
    LIMIT ${topK}
  `;

  return results;
}
