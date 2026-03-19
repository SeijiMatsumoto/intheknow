import { openai } from "@ai-sdk/openai";
import { Output, generateText } from "ai";
import { z } from "zod";
import type { CandidateItem } from "./types";

const DigestSchema = z.object({
  title: z.string(),
  summary: z.string(),
  keyTakeaways: z.array(z.string()),
  sections: z.array(
    z.object({
      heading: z.string(),
      items: z.array(
        z.object({
          title: z.string(),
          url: z.string(),
          summary: z.string(),
          quote: z.string().nullable(),
          source: z.string(),
        }),
      ),
    }),
  ),
});

export type DigestContent = z.infer<typeof DigestSchema>;

export async function synthesize(
  items: CandidateItem[],
  newsletterTitle: string,
  newsletterDescription: string,
): Promise<DigestContent> {
  const { output: digest } = await generateText({
    model: openai("gpt-5-mini"),
    experimental_output: Output.object({ schema: DigestSchema }),
    prompt: `You are writing a digest for the newsletter "${newsletterTitle}": ${newsletterDescription}

RULES:
- Every URL you cite must be taken EXACTLY from the input items — do not invent or modify URLs
- Be concise but informative

Input items:
${items
  .map(
    (item, i) => `[${i + 1}]
Title: ${item.title}
URL: ${item.url}
Source: ${item.source}
Content: ${item.content.slice(0, 500)}`,
  )
  .join("\n\n")}

Write the digest. Use "title" like "LLM Weekly — March 19, 2026".`,
  });

  // Post-synthesis URL validation — reject hallucinated links
  const validUrls = new Set(items.map((i) => i.url));
  for (const section of digest.sections) {
    for (const item of section.items) {
      if (!validUrls.has(item.url)) {
        throw new Error(`Hallucinated URL in synthesis: ${item.url}`);
      }
    }
  }

  return digest;
}
