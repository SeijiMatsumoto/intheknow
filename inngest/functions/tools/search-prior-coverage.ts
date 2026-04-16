import { tool } from "ai";
import { z } from "zod";
import { retrieveSimilarStories } from "@/lib/rag/retrieve-similar";

type PriorCoverageToolContext = {
  newsletterId: string;
};

export function makeSearchPriorCoverageTool(ctx: PriorCoverageToolContext) {
  return tool({
    description:
      "Search past editions of this newsletter for stories similar to a given topic. Use this after your web research to check if you've already covered a story recently. Returns two buckets: mustSkip (recent near-duplicates you are forbidden from including) and context (older related coverage for reference).",
    inputSchema: z.object({
      query: z
        .string()
        .describe(
          "A short description of the story or topic to check against prior coverage. E.g. 'OpenAI releases new model', 'NVIDIA earnings results'.",
        ),
    }),
    execute: async ({ query }) => {
      const results = await retrieveSimilarStories({
        newsletterId: ctx.newsletterId,
        queryText: query,
        lookbackDays: 30,
        topK: 10,
        threshold: 0.65,
      });

      if (results.length === 0) {
        return {
          mustSkip: [],
          context: [],
          message: "No similar prior coverage found.",
        };
      }

      const mapped = results.map((s) => ({
        title: s.title,
        detail: s.detail,
        category: s.category,
        daysAgo: s.daysAgo,
        similarity: Math.round(s.similarity * 100) / 100,
      }));

      const mustSkip = mapped.filter(
        (s) => s.similarity >= 0.75 && s.daysAgo < 5,
      );
      const context = mapped.filter(
        (s) => !(s.similarity >= 0.75 && s.daysAgo < 5),
      );

      return {
        mustSkip,
        context,
        message: `Found ${mustSkip.length} near-duplicate stories from the last 5 days (MUST SKIP) and ${context.length} older related stories (context only).`,
      };
    },
  });
}
