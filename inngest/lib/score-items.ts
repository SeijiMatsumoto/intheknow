import { Output, generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import type { CandidateItem } from "./types";

const FRESHNESS_WINDOW_DAYS: Record<string, number> = {
  daily: 1,
  weekly: 7,
  biweekly: 14,
};

function scoreFreshness(publishedAt: string, frequency: string): number {
  const windowDays = FRESHNESS_WINDOW_DAYS[frequency] ?? 7;
  const ageDays = (Date.now() - new Date(publishedAt).getTime()) / 86_400_000;
  if (ageDays > windowDays) return 0;
  return Math.max(1, 10 - (ageDays / windowDays) * 9);
}

function scoreEngagement(item: CandidateItem): number {
  const e = item.engagement;
  if (!e) return 5;
  const raw =
    (e.likes ?? 0) * 1 +
    (e.retweets ?? 0) * 2 +
    (e.replies ?? 0) * 1.5 +
    (e.score ?? 0) * 0.5;
  return Math.min(10, 1 + raw / 100);
}

export async function scoreItems(
  items: CandidateItem[],
  keywords: string[],
  newsletterDescription: string,
  frequency: string,
): Promise<CandidateItem[]> {
  if (items.length === 0) return [];

  const { output } = await generateText({
    model: openai("gpt-5-mini"),
    experimental_output: Output.object({
      schema: z.object({
        scores: z
          .array(z.number().min(1).max(10))
          .describe("Relevance score 1–10 for each item, in input order"),
      }),
    }),
    prompt: `You are scoring news items for a newsletter: "${newsletterDescription}"
Keywords: ${keywords.join(", ")}

Rate each item's relevance to this newsletter on a scale of 1–10.
Return one score per item in the same order as the input.

Items:
${items.map((item, i) => `${i + 1}. ${item.title}\n   ${item.content.slice(0, 200)}`).join("\n\n")}`,
  });

  const relevanceScores =
    output.scores.length === items.length ? output.scores : items.map(() => 5);

  return items.map((item, i) => {
    const freshnessScore = scoreFreshness(item.publishedAt, frequency);
    const engagementScore = scoreEngagement(item);
    const worthScore = (relevanceScores[i] ?? 5) * 0.6 + engagementScore * 0.4;
    const combinedScore = freshnessScore * 0.4 + worthScore * 0.6;
    return {
      ...item,
      freshnessScore: Math.round(freshnessScore * 10) / 10,
      worthScore: Math.round(worthScore * 10) / 10,
      combinedScore: Math.round(combinedScore * 10) / 10,
    };
  });
}
