"use server";

import { openai } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export type GeneratedNewsletter = {
  title: string;
  description: string;
  categoryId: string;
  frequency: "daily" | "weekly";
  scheduleDays: (typeof DAYS)[number][];
  scheduleHour: number;
  keywords: string[];
}

function buildSchema(categoryIds: [string, ...string[]]) {
  return z.object({
    valid: z
      .boolean()
      .describe(
        "true if this is a legitimate, appropriate newsletter topic. false if nsfw, offensive, nonsensical, or clearly a joke/test input.",
      ),
    refusalReason: z
      .string()
      .nullable()
      .describe(
        "Set to a brief explanation when valid is false, otherwise null.",
      ),
    title: z.string().describe("Short, punchy newsletter title"),
    description: z
      .string()
      .describe("1-2 sentence description of what subscribers get"),
    categoryId: z
      .enum(categoryIds)
      .describe(`Category id — must be one of: ${categoryIds.join(", ")}`),
    frequency: z.enum(["daily", "weekly"]),
    scheduleDays: z
      .array(z.enum(DAYS))
      .describe(
        "Days to send. For daily use weekdays. For weekly pick one day that fits the topic.",
      ),
    scheduleHour: z
      .number()
      .int()
      .min(0)
      .max(23)
      .describe("UTC hour to send (0-23). Use 8 for morning."),
    keywords: z
      .array(z.string())
      .describe("6-10 specific search keywords for sourcing content"),
  });
}

export async function generateNewsletterFields(
  prompt: string,
): Promise<{ data?: GeneratedNewsletter; error?: string }> {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
    });

    if (categories.length === 0) {
      return { error: "No categories found in database" };
    }

    const categoryIds = categories.map((c) => c.id) as [string, ...string[]];
    const categoryList = categories
      .map((c) => `${c.id} (${c.label})`)
      .join(", ");
    const schema = buildSchema(categoryIds);

    const { output } = await generateText({
      model: openai("gpt-5.4-mini"),
      output: Output.object({ schema }),
      system: `You are a newsletter configuration assistant. Your job is to generate structured newsletter configurations from user descriptions.

CONTENT POLICY — reject requests that are:
- NSFW, sexual, violent, hateful, or discriminatory
- Clearly nonsensical, gibberish, or test inputs (e.g. "asdf", "lol idk", "newsletter about my dog's farts")
- Promoting illegal activity, scams, or misinformation
- Jokes or clearly not serious newsletter topics

When rejecting, set valid=false and provide a brief, friendly refusalReason. Still fill in dummy values for other fields — they will be ignored.

When accepting, set valid=true and omit refusalReason. Generate high-quality, specific configurations.`,
      prompt: `User's newsletter request: "${prompt}"

Available categories: ${categoryList}

Pick the most fitting categoryId from the list above. Choose the best frequency and schedule. Generate specific, high-quality keywords that would be used to find relevant content for this newsletter.`,
    });

    const result = output as z.infer<ReturnType<typeof buildSchema>>;

    if (!result.valid) {
      return {
        error:
          result.refusalReason ??
          "That doesn't seem like a valid newsletter topic. Please try a real subject.",
      };
    }

    const { valid: _v, refusalReason: _r, ...newsletter } = result;
    return { data: newsletter as GeneratedNewsletter };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Generation failed" };
  }
}
