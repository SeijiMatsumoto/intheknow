import { openai } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import { z } from "zod";
import type { CandidateItem } from "./types";

const DigestSchema = z.object({
  editionTitle: z.string(), // punchy click-baity one-liner for this edition
  summary: z.string(), // warm, friendly intro paragraph
  keyTakeaways: z.array(z.string()),
  sections: z.array(
    z.object({
      heading: z.string(),
      items: z.array(
        z.object({
          title: z.string(),
          url: z.string(),
          publishedAt: z.string(), // YYYY-MM-DD, copied from input
          source: z.string(),
          plainLead: z.string(), // one sentence, no jargon — why it matters
          detail: z.string(), // 2–3 sentences with the actual specifics and numbers
          quote: z.string().nullable(),
        }),
      ),
    }),
  ),
  bottomLine: z.string(), // friendly wrap-up / executive summary at the end
});

export type DigestContent = z.infer<typeof DigestSchema>;

export async function synthesize(
  items: CandidateItem[],
  newsletterTitle: string,
  newsletterDescription: string,
  frequency: string,
): Promise<DigestContent> {
  const { output: digest } = await generateText({
    model: openai("gpt-4o-mini"),
    experimental_output: Output.object({ schema: DigestSchema }),
    prompt: `You are writing a ${frequency} digest for "${newsletterTitle}": ${newsletterDescription}

TONE: Friendly, conversational, and warm — like a smart friend catching you up over coffee. Not overly casual, but definitely not stiff or corporate. Use "you" to address the reader. Occasional light humor is welcome.

RULES:
- Every URL must be taken EXACTLY from the input items — never invent or modify URLs
- Copy publishedAt exactly from the input item
- editionTitle: a punchy, creative one-liner that captures the biggest story or overall theme of this edition. Make it click-worthy — think newsletter subject line.
- summary: 2–3 sentence friendly intro. What's the vibe this week/today? What's the big story?
- keyTakeaways: 3–5 bite-sized bullets. Punchy. Start each with a strong verb or number.
- sections: group related items under a short, descriptive heading
- Each item needs TWO layers of body copy:
    • plainLead: ONE sentence in plain English — no jargon — explaining why this matters. Imagine explaining to a curious friend who isn't in the industry.
    • detail: 2–3 sentences with the real specifics — numbers, names, technical nuance. For experts who want depth.
- quote: include only if there's a genuinely interesting direct quote from the source. null otherwise.
- bottomLine: 2–3 sentence friendly wrap-up. What does it all mean? Any threads connecting the stories? End on a forward-looking or thought-provoking note.

Input items:
${items
  .map(
    (item, i) => `[${i + 1}]
Title: ${item.title}
URL: ${item.url}
Source: ${item.source}
PublishedAt: ${item.publishedAt}
Content: ${item.content.slice(0, 600)}`,
  )
  .join("\n\n")}`,
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
