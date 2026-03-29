import { openai } from "@ai-sdk/openai";
import { getTracer } from "@lmnr-ai/lmnr";
import { generateText, hasToolCall, stepCountIs, type Tool } from "ai";
import { z } from "zod";
import { getDigestConfig } from "@/lib/digest-config";
import { type Frequency, windowLabel } from "@/lib/frequency";
import type { Plan } from "@/lib/user";
import { makeSearchBlueskyTool } from "./tools/search-bluesky";
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
    .describe(
      "2-3 sentence opener that tells the reader why THIS edition matters to them specifically. Not a dry summary — speak directly to why they should care based on the newsletter's topic and description. E.g. for an AI engineering newsletter: 'Three new models dropped this week, and one of them changes how you'll build agents. Plus, the tooling war is heating up.' Lead with the most impactful story.",
    ),
  keyTakeaways: z
    .array(z.string())
    .describe(
      "3-5 short, punchy teaser bullets — just enough to hook the reader without giving away the full story. Frame each around impact to the reader, not just what happened. E.g. 'OpenAI drops a new model — and it's free', 'The Fed holds rates, but the real signal is elsewhere'",
    ),
  sections: z.array(
    z.object({
      heading: z.string(),
      items: z.array(
        z.object({
          category: z
            .string()
            .describe(
              "Short label (1-3 words) classifying the type of news. E.g. 'Product Launch', 'Model Release', 'Funding Round', 'Policy Shift', 'Acquisition', 'Security Breach', 'Earnings', 'Open Source', 'Research Paper', 'Regulation', 'Partnership', 'Industry Trend'. Pick the most specific label that fits.",
            ),
          title: z
            .string()
            .describe(
              "Editorial, opinionated headline. Not a restated article title — a punchy take. No emojis. E.g. 'OpenAI Just Made GPT-5 Free — Here's the Catch', 'The Fed Blinked, and Markets Noticed'",
            ),
          icon: z
            .enum([
              "flame",
              "trending-up",
              "trending-down",
              "rocket",
              "alert-triangle",
              "lightbulb",
              "shield",
              "globe",
              "cpu",
              "zap",
              "megaphone",
              "scale",
              "landmark",
              "heart-pulse",
              "flask-conical",
              "gamepad-2",
              "coins",
            ])
            .describe(
              "Icon that best represents the story's tone or topic. E.g. 'flame' for hot/breaking, 'trending-up' for growth/gains, 'alert-triangle' for warnings/risks, 'lightbulb' for ideas/innovation.",
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
                    "ISO 8601 date (YYYY-MM-DD) of the source article. Convert relative dates like '6 days ago' to absolute dates.",
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
              "1-3 sentences explaining why this matters to the reader. Don't just restate facts — tell them the 'so what'. How does this affect their work, their tools, their industry? Write like you're explaining it to a smart colleague over coffee.",
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
          author: z
            .string()
            .describe("Bluesky handle. E.g. '@karpathy.bsky.social'"),
          authorName: z
            .string()
            .describe("Display name. E.g. 'Andrej Karpathy'"),
          url: z.string().describe("Direct link to the post."),
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
      "Public reaction and discourse from Bluesky. Null when not available.",
    ),
  bottomLine: z
    .string()
    .describe(
      "4-6 sentence editorial synthesis that ties the edition's stories together into a coherent narrative. What's the bigger picture? What patterns or tensions connect these stories? End with a forward-looking take — what should the reader watch for next? This is the 'editor's perspective' section, not a recap. Write with conviction and insight, like a columnist wrapping up the week.",
    ),
  agentSummary: z
    .string()
    .describe(
      "1-2 sentence internal summary of what was researched and generated. E.g. 'Searched web 3 times across AI agents, LLM releases, and RAG tooling. Generated 8 stories across 3 sections.'",
    ),
  skipEdition: z
    .boolean()
    .describe(
      "Set to true ONLY when searches returned zero usable, relevant stories for this newsletter's topics. When true, the edition will not be sent to subscribers. Do NOT set this to true if you found even 2-3 real stories — a short edition is fine. Only skip when there is genuinely nothing to report.",
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
  priorTitles?: string[];
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
    priorTitles = [],
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

  // Only include Bluesky search when tier supports it
  if (config.socialConsensus) {
    tools.searchBluesky = makeSearchBlueskyTool(toolCtx);
  }

  // Tier-specific instructions
  const blueskyInstruction = config.socialConsensus
    ? "\n2. Use searchBluesky to find social/community discussion and public reaction to key stories. Include notable takes, sentiment, and consensus."
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
    system: `You are an expert newsletter writer and research editor. You write like a sharp, opinionated industry insider — a smart colleague catching the reader up. Friendly, conversational, warm. Use "you" to address the reader. Always frame stories through the lens of the newsletter's specific topic and audience.

<guidelines>
- Only include genuinely newsworthy stories. Shorter and high-quality beats longer and padded.
- Item titles: editorial, opinionated headlines — not restated article titles. Punchy, no emojis.
- Detail field: explain the "so what" — why the reader should care, not just what happened.
- keyTakeaways: hook the reader around impact, not just events.
- Summary (intro): lead with the biggest story. No throat-clearing or meta-commentary about the edition.
- bottomLine (Editor's Note): synthesize, don't summarize. Connect dots between stories, identify patterns, tell the reader what to watch for. 4-6 sentences with conviction.
- Combine multiple articles covering the same story into one item with multiple sources.
- If prior edition titles are provided, skip those stories unless there's a genuinely new development.
- Only include a quote if it's genuinely interesting, otherwise null.
- All URLs must be real from your research — never invent them.
- If searches return zero usable stories, set skipEdition to true. Never fabricate filler. But if you have 2-3 real stories, write a shorter edition.
- Write as a human editor. Never reference searches, tools, AI, or the research process. If you wouldn't see it in the NYT Morning Briefing, don't write it.
- NEVER use these clichéd constructions: "it's not just X — it's Y", "it's less about X and more about Y", "this isn't about X — it's about Y", "the real story here is", "the bigger picture is", "if there's one takeaway", "one thing is clear", "the writing is on the wall", "buckle up", "let that sink in", "full stop". Just state your point directly.${socialConsensusInstruction}${depthInstruction}
</guidelines>

<search-queries>
- First-round queries are for DISCOVERY. Use broad topic queries (2-5 words, core nouns only).
  GOOD: "AI model announcements", "federal reserve policy"  BAD: "OpenAI GPT-5 release" (you don't know what happened yet)
- Follow-up queries can be specific: "GPT-5 pricing details", "NVIDIA earnings breakdown"
- No dates, time references, or site: operators — date filtering is automatic.
- Each query must target a different topic. Don't retry queries that returned seen results.
</search-queries>

<workflow>
1. Call searchWeb 3-5 times in parallel with diverse queries covering the newsletter's topic areas.
2. Review results. If a major topic area has zero coverage, do a follow-up round of 2-3 searches. Otherwise proceed.${blueskyInstruction}
${submitStep}. Call submitAnswer with the fully written newsletter.

You MUST always call submitAnswer as the final step. If running low on steps, skip additional searches and submit with what you have.
</workflow>`,
    prompt: `Research and write the ${frequency} edition of "${title}".

<context>
${description ? `<description>${description}</description>` : ""}
<keywords>${keywords.join(", ")}</keywords>
${domainHints.length > 0 ? `<preferred-sources>${domainHints.join(", ")}</preferred-sources>` : ""}
<time-window>${windowLabel(frequency)}</time-window>
<story-target>up to ${config.storyTarget}</story-target>
</context>
${priorTitles.length > 0 ? `\n<prior-edition-stories>\nThe following stories were covered in the last edition. Do NOT repeat them unless there is a major new development:\n${priorTitles.map((t) => `- ${t}`).join("\n")}\n</prior-edition-stories>` : ""}
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
