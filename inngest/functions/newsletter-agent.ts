import { openai } from "@ai-sdk/openai";
import { generateText, hasToolCall, stepCountIs, type Tool } from "ai";
import { z } from "zod";
import { getDigestConfig } from "@/lib/digest-config";
import type { Plan } from "@/lib/user";
import {
  makeSearchTwitterTool,
  makeSearchWebTool,
  makeSubmitAnswerTool,
} from "./tools";

// ── Output schema ─────────────────────────────────────────────────────────────

export const DigestSchema = z.object({
  editionTitle: z.string(),
  summary: z.string(),
  keyTakeaways: z.array(z.string()),
  sections: z.array(
    z.object({
      heading: z.string(),
      items: z.array(
        z.object({
          title: z.string(),
          url: z.string(),
          publishedAt: z.string(),
          source: z.string(),
          plainLead: z.string(),
          detail: z.string(),
          quote: z.string().nullable(),
        }),
      ),
    }),
  ),
  bottomLine: z.string(),
  agentSummary: z
    .string()
    .describe(
      "1–2 sentence internal summary of what was researched and generated. E.g. 'Searched web 3 times across AI agents, LLM releases, and RAG tooling. Generated 8 stories across 3 sections.'",
    ),
});

export type DigestContent = z.infer<typeof DigestSchema>;

// ── Newsletter input ──────────────────────────────────────────────────────────

export interface NewsletterInput {
  title: string;
  description: string | null;
  frequency: string;
  keywords: string[];
  sources: {
    rss?: string[];
    sites?: string[];
    twitter_queries?: string[];
  };
  tier?: Plan;
}

// ── Main agent ────────────────────────────────────────────────────────────────

export interface AgentResult {
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
    sources,
    tier = "pro",
  } = newsletter;
  const windowLabel = frequency === "daily" ? "past 24 hours" : "past 7 days";
  const domainHints = [...(sources.rss ?? []), ...(sources.sites ?? [])]
    .map((u) => {
      try {
        return new URL(u).hostname.replace(/^www\./, "");
      } catch {
        return u;
      }
    })
    .filter(Boolean)
    .slice(0, 6);

  let output: DigestContent | null = null;

  const config = getDigestConfig(tier);

  // Build tools based on tier
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tools: Record<string, Tool> = {
    searchWeb: makeSearchWebTool(keywords, frequency),
    submitAnswer: makeSubmitAnswerTool((digest) => {
      output = digest;
    }),
  };

  // Only include Twitter search when tier supports it
  if (config.socialConsensus) {
    tools.searchTwitter = makeSearchTwitterTool(keywords);
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
    system: `You are an expert newsletter writer and research editor for "${title}".
Newsletter description: ${description ?? title}
Frequency: ${frequency}
Core topics/keywords: ${keywords.join(", ")}
${domainHints.length > 0 ? `Preferred sources: ${domainHints.join(", ")}` : ""}

Your job:
1. Use searchWeb to research the most important recent developments (${windowLabel}). Search with multiple focused queries — different angles, subtopics, or follow-up questions — until you have rich, varied coverage.${twitterInstruction}
${submitStep}. Once you have enough material, call submitAnswer with the fully written newsletter. Include up to ${config.storyTarget} stories, but only if they are genuinely newsworthy — never pad with fluff. A shorter, high-quality digest is always better than a longer one stuffed with filler.

Writing tone: Friendly, conversational, warm — like a smart friend catching you up over coffee. Use "you" to address the reader. Occasional light humor welcome.

submitAnswer schema rules:
- editionTitle: punchy, creative one-liner capturing the biggest story or theme. Think: newsletter subject line.
- summary: 2-3 sentence friendly intro. What's the vibe this ${frequency === "daily" ? "day" : "week"}?
- keyTakeaways: 3-5 punchy one-sentence bullets summarizing the key story. Write each as a complete sentence, e.g. "Xiaomi plans to pour $8.7B into AI over the next three years."
- sections: group related items under short descriptive headings.
- Each item needs: plainLead (one plain-English sentence — why it matters to a non-expert), detail (2-3 sentences with specifics, numbers, names), quote (only if genuinely interesting, otherwise null).${depthInstruction}
- URLs must be real URLs from your research — never invent them.
- bottomLine: 2-3 sentence wrap-up. What does it all mean? End on a forward-looking note.
- agentSummary: 1-2 sentences describing what you searched for and what you produced. E.g. "Searched web 3 times across AI agents, LLM releases, and RAG tooling. Generated 8 stories across 3 sections."`,
    prompt: `Research and write the ${frequency} edition of "${title}". Focus on: ${keywords.join(", ")}. Start by searching for the most important recent stories.`,
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
