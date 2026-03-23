import { openai } from "@ai-sdk/openai";
import { getTracer } from "@lmnr-ai/lmnr";
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
    .describe(
      "Punchy, creative one-liner for the subject line. E.g. 'OpenAI Goes Nuclear'",
    ),
  summary: z
    .string()
    .describe("2-3 sentence friendly intro setting the tone for this edition."),
  keyTakeaways: z
    .array(z.string())
    .describe(
      "3-5 short, punchy teaser bullets — just enough to hook the reader without giving away the full story. E.g. 'OpenAI drops a new model — and it's free', 'The Fed holds rates, but the real signal is elsewhere'",
    ),
  sections: z.array(
    z.object({
      heading: z.string(),
      items: z.array(
        z.object({
          title: z
            .string()
            .describe(
              "Editorial, opinionated headline with an emoji prefix. Not a restated article title — a punchy take. E.g. '🔥 OpenAI Just Made GPT-5 Free — Here's the Catch', '📉 The Fed Blinked, and Markets Noticed'",
            ),
          sources: z
            .array(
              z.object({
                url: z
                  .string()
                  .describe("Real URL from research — never invented."),
                name: z
                  .string()
                  .describe(
                    "Publication or domain name. E.g. 'The Verge', 'techcrunch.com'",
                  ),
                publishedAt: z
                  .string()
                  .describe(
                    "ISO date string or human-readable date of the source article.",
                  ),
              }),
            )
            .min(1)
            .describe(
              "One or more source articles. Lead with the primary source. Combine sources when multiple articles cover the same story.",
            ),
          detail: z
            .string()
            .describe(
              "1-2 concise sentences on the impact or 'so what'. Readers can click through for the full story.",
            ),
          quote: z
            .string()
            .nullable()
            .describe(
              "A notable quote from the article. Null if nothing genuinely interesting.",
            ),
        }),
      ),
    }),
  ),
  socialConsensus: z
    .object({
      overview: z
        .string()
        .describe(
          "2-3 sentence synthesis of the overall public conversation and sentiment.",
        ),
      highlights: z.array(
        z.object({
          text: z
            .string()
            .describe("The take — paraphrased or directly quoted."),
          author: z.string().describe("Twitter/X handle. E.g. '@karpathy'"),
          authorName: z
            .string()
            .describe("Display name. E.g. 'Andrej Karpathy'"),
          url: z.string().describe("Direct link to the tweet."),
          engagement: z
            .string()
            .nullable()
            .describe(
              "Engagement summary if notable. E.g. '12K likes'. MUST be null (not a string like 'Not available') if engagement data is unknown or unavailable.",
            ),
        }),
      ),
    })
    .nullable()
    .describe(
      "Public reaction and discourse from Twitter/X. Null when not available.",
    ),
  bottomLine: z
    .string()
    .describe(
      "2-3 sentence wrap-up. What does it all mean? End on a forward-looking note.",
    ),
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
};

// ── Main agent ────────────────────────────────────────────────────────────────

export type ToolCallLog = {
  stepNumber: number;
  toolName: string;
  args: unknown;
  result: unknown;
};

export type AgentResult = {
  digest: DigestContent;
  model: string;
  stepCount: number;
  usage: { inputTokens: number; outputTokens: number };
  toolCallCounts: Record<string, number>;
  toolCallLog: ToolCallLog[];
};

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

  const seenUrls = new Set<string>();

  const toolCtx = {
    frequency,
    newsletterTitle: title,
    newsletterDescription: description,
    keywords,
    seenUrls,
  };

  const tools: Record<string, Tool> = {
    searchWeb: makeSearchWebTool(toolCtx),
    submitAnswer: makeSubmitAnswerTool((digest) => {
      output = digest;
    }),
  };

  // Only include Twitter search when tier supports it
  if (config.socialConsensus) {
    tools.searchTwitter = makeSearchTwitterTool(toolCtx);
  }

  // Tier-specific instructions
  const twitterInstruction = config.socialConsensus
    ? "\n2. Use searchTwitter to find social/community discussion and public reaction to key stories. Include notable takes, sentiment, and consensus."
    : "";
  const socialConsensusInstruction = config.socialConsensus
    ? ""
    : "\n- socialConsensus MUST be set to null. Do not fabricate social media reactions.";
  const depthInstruction = config.deepResearch
    ? "\n- Provide extended analysis with more specifics, numbers, and context in each item's detail field."
    : "";
  const submitStep = config.socialConsensus ? "4" : "3";

  const { steps, usage } = await generateText({
    model: openai(config.model),
    tools,
    stopWhen: [hasToolCall("submitAnswer"), stepCountIs(config.maxSteps)],
    experimental_telemetry: {
      isEnabled: true,
      tracer: getTracer(),
      metadata: { newsletterTitle: title, tier, frequency },
    },
    system: `You are an expert newsletter writer and research editor.

<guidelines>
- Write in a friendly, conversational, warm tone — like a smart friend catching you up over coffee.
- Use "you" to address the reader. Occasional light humor welcome.
- Only include stories that are genuinely newsworthy — never pad with fluff. A shorter, high-quality digest is always better than a longer one stuffed with filler.
- Each item title must be an editorial, opinionated headline with an emoji prefix — not a restated article title. Make it punchy and attention-grabbing.
- The detail field should be 1-2 concise sentences on the impact or "so what" — readers can click through for the full story. Do NOT write lengthy paragraphs.
- keyTakeaways should be short teaser bullets — hook the reader without giving away the full story.
- All URLs in sources must be real URLs from your research — never invent them.
- When multiple articles cover the same story, combine them into a single item with multiple sources rather than creating separate items.
- Only include a quote if it's genuinely interesting, otherwise set it to null.${socialConsensusInstruction}${depthInstruction}
</guidelines>

<search-queries>
- Your first-round queries are for DISCOVERY — you don't know what happened yet. Use broad topic queries that cast a wide net.
  GOOD first-round: "AI model announcements", "tech layoffs", "federal reserve policy", "crypto regulation"
  BAD first-round: "OpenAI GPT-5 release" (you don't know GPT-5 was released — that's what you're trying to find out)
- Follow-up queries (if needed) can be specific to drill into a story you discovered: "GPT-5 pricing details", "NVIDIA earnings breakdown"
- Keep queries short: 2-5 words, core nouns only. No filler, no full sentences.
- NEVER include dates, time references ("past 24 hours", "March 2026"), or site: operators. Date filtering is automatic.
- Each query must target a distinctly different topic. No rephrasing the same query.
- If a search returns results you've already seen, move on — do not retry.
- Stop searching once you have enough material. More searches ≠ better newsletter.
</search-queries>

<workflow>
1. In your FIRST response, call searchWeb multiple times in parallel with diverse queries covering different angles of the newsletter topics. Aim for 3-5 parallel searches to get broad coverage upfront.
2. Review the results. Each search result includes a coverage count — if you have 6+ unique sources, you almost certainly have enough material. Proceed to submitAnswer.${twitterInstruction}
   Only do a follow-up search if a MAJOR topic area from the keywords has ZERO coverage. A second search round should be rare. NEVER search for a topic you already have results for.
${submitStep}. Call submitAnswer with the fully written newsletter.
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

  // Hard gate: strip socialConsensus when tier doesn't support it
  if (!config.socialConsensus) {
    (output as DigestContent).socialConsensus = null;
  }
  const digest = output as DigestContent;

  const toolCallCounts: Record<string, number> = {};
  const toolCallLog: ToolCallLog[] = [];

  for (const s of steps) {
    for (const tc of s.toolCalls ?? []) {
      toolCallCounts[tc.toolName] = (toolCallCounts[tc.toolName] ?? 0) + 1;
    }

    // Build detailed log by matching tool calls with their results
    const resultsByCallId = new Map(
      (s.toolResults ?? []).map((tr) => [tr.toolCallId, tr]),
    );
    for (const tc of s.toolCalls ?? []) {
      const tr = resultsByCallId.get(tc.toolCallId);
      toolCallLog.push({
        stepNumber: s.stepNumber,
        toolName: tc.toolName,
        args: tc.input,
        result: tr?.output,
      });
    }
  }

  return {
    digest,
    model: config.model,
    stepCount: steps.length,
    usage: {
      inputTokens: usage.inputTokens ?? 0,
      outputTokens: usage.outputTokens ?? 0,
    },
    toolCallCounts,
    toolCallLog,
  };
}
