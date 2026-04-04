import { tool } from "ai";
import { z } from "zod";
import { retrieveSimilarStories } from "@/lib/rag/retrieve-similar";

type PriorCoverageToolContext = {
  newsletterId: string;
};

export function makeSearchPriorCoverageTool(ctx: PriorCoverageToolContext) {
  return tool({
    description:
      "Search past editions of this newsletter for stories similar to a given topic. Use this after your web research to check if you've already covered a story recently. Returns matching prior stories with how many days ago they were published.",
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
        threshold: 0.78,
      });

      if (results.length === 0) {
        return { priorStories: [], message: "No similar prior coverage found." };
      }

      return {
        priorStories: results.map((s) => ({
          title: s.title,
          detail: s.detail,
          category: s.category,
          daysAgo: s.daysAgo,
          similarity: Math.round(s.similarity * 100) / 100,
        })),
        message: `Found ${results.length} similar stories from prior editions.`,
      };
    },
  });
}
