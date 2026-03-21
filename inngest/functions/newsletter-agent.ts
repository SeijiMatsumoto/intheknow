import { openai } from "@ai-sdk/openai";
import { generateText, hasToolCall, stepCountIs, type Tool } from "ai";
import { z } from "zod";
import { getDigestConfig } from "@/lib/digest-config";
import { type Frequency, windowLabel } from "@/lib/frequency";
import type { Plan } from "@/lib/user";
import { makeSearchTwitterTool } from "./tools/search-twitter";
import { makeSearchWebTool } from "./tools/search-web";
import { makeSubmitAnswerTool } from "./tools/submit-answer";

// ── Output schema ─────────────────────────────────────────────────────────────

export const DigestSchema = z.object({
  editionTitle: z
    .string()
    .describe("Punchy, creative one-liner for the subject line. E.g. 'OpenAI Goes Nuclear'"),
  summary: z
    .string()
    .describe("2-3 sentence friendly intro setting the tone for this edition."),
  keyTakeaways: z
    .array(z.string())
    .describe("3-5 one-sentence bullets summarizing the biggest stories. Each should be a complete sentence."),
  sections: z.array(
    z.object({
      heading: z.string(),
      items: z.array(
        z.object({
          title: z.string(),
          url: z.string().describe("Real URL from research — never invented."),
          publishedAt: z.string().describe("ISO date string or human-readable date of the source article."),
          source: z.string().describe("Publication or domain name. E.g. 'The Verge', 'techcrunch.com'"),
          plainLead: z
            .string()
            .describe("One plain-English sentence explaining why this matters to a non-expert."),
          detail: z
            .string()
            .describe("2-3 sentences with specifics, numbers, and names."),
          quote: z
            .string()
            .nullable()
            .describe("A notable quote from the article. Null if nothing genuinely interesting."),
        }),
      ),
    }),
  ),
  socialConsensus: z
    .object({
      overview: z
        .string()
        .describe("2-3 sentence synthesis of the overall public conversation and sentiment."),
      highlights: z.array(
        z.object({
          text: z.string().describe("The take — paraphrased or directly quoted."),
          author: z.string().describe("Twitter/X handle. E.g. '@karpathy'"),
          authorName: z.string().describe("Display name. E.g. 'Andrej Karpathy'"),
          url: z.string().describe("Direct link to the tweet."),
          engagement: z
            .string()
            .nullable()
            .describe("Engagement summary if notable. E.g. '12K likes'. Null if unknown."),
        }),
      ),
    })
    .nullable()
    .describe("Public reaction and discourse from Twitter/X. Null when not available."),
  bottomLine: z
    .string()
    .describe("2-3 sentence wrap-up. What does it all mean? End on a forward-looking note."),
  agentSummary: z
    .string()
    .describe(
      "1-2 sentence internal summary of what was researched and generated. E.g. 'Searched web 3 times across AI agents, LLM releases, and RAG tooling. Generated 8 stories across 3 sections.'",
    ),
});

export type DigestContent = z.infer<typeof DigestSchema>;

// ── Newsletter input ──────────────────────────────────────────────────────────

export type NewsletterInput = {
  title: string;
  description: string | null;
  frequency: Frequency;
  keywords: string[];
  domainHints?: string[];
  tier?: Plan;
}

// ── Main agent ────────────────────────────────────────────────────────────────

export type AgentResult = {
  digest: DigestContent;
  stepCount: number;
  usage: { inputTokens: number; outputTokens: number };
  toolCallCounts: Record<string, number>;
}

export async function runNewsletterAgent(
  newsletter: NewsletterInput,
): Promise<AgentResult> {
  const {
    title,
    description,
    frequency,
    keywords,
    domainHints = [],
    tier = "pro",
  } = newsletter;

  let output: DigestContent | null = null;

  const config = getDigestConfig(tier);

  const tools: Record<string, Tool> = {
    searchWeb: makeSearchWebTool(frequency),
    submitAnswer: makeSubmitAnswerTool((digest) => {
      output = digest;
    }),
  };

  // Only include Twitter search when tier supports it
  if (config.socialConsensus) {
    tools.searchTwitter = makeSearchTwitterTool(frequency);
  }

  // Tier-specific instructions
  const twitterInstruction = config.socialConsensus
    ? "\n2. Use searchTwitter to find social/community discussion and public reaction to key stories. Include notable takes, sentiment, and consensus."
    : "";
  const depthInstruction = config.deepResearch
    ? "\n- Provide extended analysis with more specifics, numbers, and context in each item's detail field."
    : "";
  const submitStep = config.socialConsensus ? "3" : "2";

  const { steps, usage } = await generateText({
    model: openai(config.model),
    tools,
    stopWhen: [hasToolCall("submitAnswer"), stepCountIs(config.maxSteps)],
    system: `You are an expert newsletter writer and research editor.

<guidelines>
- Write in a friendly, conversational, warm tone — like a smart friend catching you up over coffee.
- Use "you" to address the reader. Occasional light humor welcome.
- Only include stories that are genuinely newsworthy — never pad with fluff. A shorter, high-quality digest is always better than a longer one stuffed with filler.
- URLs must be real URLs from your research — never invent them.
- Only include a quote if it's genuinely interesting, otherwise set it to null.${depthInstruction}
</guidelines>

<workflow>
1. Use searchWeb to research recent developments. Search with multiple focused queries — different angles, subtopics, and follow-up questions — until you have rich, varied coverage.${twitterInstruction}
${submitStep}. Once you have enough material, call submitAnswer with the fully written newsletter.
</workflow>`,
    prompt: `Research and write the ${frequency} edition of "${title}".

<context>
${description ? `<description>${description}</description>` : ""}
<keywords>${keywords.join(", ")}</keywords>
${domainHints.length > 0 ? `<preferred-sources>${domainHints.join(", ")}</preferred-sources>` : ""}
<time-window>${windowLabel(frequency)}</time-window>
<story-target>up to ${config.storyTarget}</story-target>
</context>

Start by searching for the most important recent stories.`,
  });

  if (!output) {
    throw new Error("Newsletter agent did not call submitAnswer");
  }

  const toolCallCounts: Record<string, number> = {};
  for (const s of steps) {
    for (const tc of s.toolCalls ?? []) {
      toolCallCounts[tc.toolName] = (toolCallCounts[tc.toolName] ?? 0) + 1;
    }
  }

  return {
    digest: output,
    stepCount: steps.length,
    usage: {
      inputTokens: usage.inputTokens ?? 0,
      outputTokens: usage.outputTokens ?? 0,
    },
    toolCallCounts,
  };
}
