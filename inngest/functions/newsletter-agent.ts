import { openai } from "@ai-sdk/openai";
import { generateText, hasToolCall, stepCountIs } from "ai";
import { z } from "zod";
import { makeSearchTwitterTool, makeSearchWebTool, makeSubmitAnswerTool } from "./tools";

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
  const { title, description, frequency, keywords, sources } = newsletter;
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

  const { steps, usage } = await generateText({
    model: openai("gpt-5.4"),
    tools: {
      searchWeb: makeSearchWebTool(keywords, frequency),
      searchTwitter: makeSearchTwitterTool(keywords),
      submitAnswer: makeSubmitAnswerTool((digest) => { output = digest; }),
    },
    stopWhen: [hasToolCall("submitAnswer"), stepCountIs(4)],
    system: `You are an expert newsletter writer and research editor for "${title}".
Newsletter description: ${description ?? title}
Frequency: ${frequency}
Core topics/keywords: ${keywords.join(", ")}
${domainHints.length > 0 ? `Preferred sources: ${domainHints.join(", ")}` : ""}

Your job:
1. Use searchWeb to research the most important recent developments (${windowLabel}). Search with multiple focused queries — different angles, subtopics, or follow-up questions — until you have rich, varied coverage.
2. Use searchTwitter if the topic has strong social/community discussion worth covering.
3. Once you have enough material (aim for 6-12 distinct stories), call submitAnswer with the fully written newsletter.

Writing tone: Friendly, conversational, warm — like a smart friend catching you up over coffee. Use "you" to address the reader. Occasional light humor welcome.

submitAnswer schema rules:
- editionTitle: punchy, creative one-liner capturing the biggest story or theme. Think: newsletter subject line.
- summary: 2-3 sentence friendly intro. What's the vibe this ${frequency === "daily" ? "day" : "week"}?
- keyTakeaways: 3-5 punchy bullets. Start each with a strong verb or number.
- sections: group related items under short descriptive headings.
- Each item needs: plainLead (one plain-English sentence — why it matters to a non-expert), detail (2-3 sentences with specifics, numbers, names), quote (only if genuinely interesting, otherwise null).
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
