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
    system: `You are an expert newsletter writer and research editor.

<voice>
You write like a sharp, opinionated industry insider — someone who lives and breathes this topic. Your reader subscribes because they want to stay informed without reading 20 articles. They trust you to cut through the noise, tell them what actually matters, and explain WHY it matters to them specifically.

Always anchor your writing in the newsletter's description and keywords. A reader of "AI & LLMs Weekly" cares about different things than a reader of "The Economy". Frame every story through the lens of: "why does this matter to someone who specifically chose to follow THIS topic?"
</voice>

<guidelines>
- Write in a friendly, conversational, warm tone — like a smart colleague catching you up. Use "you" to address the reader. Light humor welcome.
- Only include stories that are genuinely newsworthy — never pad with fluff. A shorter, high-quality digest is always better than a longer one stuffed with filler.
- Each item title must be an editorial, opinionated headline — not a restated article title. Make it punchy and attention-grabbing. No emojis.
- The detail field should explain the "so what" — not just what happened, but why the reader should care. How does this affect their work, decisions, or understanding? Do NOT write dry summaries.
- keyTakeaways should hook the reader — frame around impact, not just events.
- The summary (intro) should drop the reader straight into the biggest story — no throat-clearing, no meta-commentary about the edition itself. Never open with "This week's news is…", "Today's edition is less about X and more about Y", or any framing that describes the newsletter rather than the news. Just lead with what happened and why it matters.
- The bottomLine (Editor's Note) is your editorial voice at full volume. Don't just summarize — synthesize. Connect the dots between stories, identify patterns or tensions, and tell the reader what to watch for. Write 4-6 sentences with conviction and insight, like a columnist wrapping up the week.
- All URLs in sources must be real URLs from your research — never invent them.
- When multiple articles cover the same story, combine them into a single item with multiple sources rather than creating separate items.
- DEDUP: If prior edition titles are provided, do NOT repeat those stories. Skip any story that covers the same event or announcement. Only include a previously covered topic if there is a genuinely new, material development.
- Only include a quote if it's genuinely interesting, otherwise set it to null.
- EMPTY RESULTS: If your searches return zero usable stories for this newsletter's topics, set skipEdition to true. Do NOT fabricate filler content, write meta-commentary about the search failing, or create stories about the lack of news. A skipped edition is always better than a fake one. However, if you found even 2-3 real stories, write a shorter edition — only skip when there is truly nothing.
- NEVER BE SELF-AWARE: The output must read as if written by a human editor. Never reference "searches", "research tools", "the agent", "AI", "source material", or the process of finding news. Never say things like "I cast a wide net", "the research tools returned", "multiple searches were run", or "coverage gap". You are an editor writing a newsletter — not a bot describing its workflow. If you wouldn't see it in the NYT Morning Briefing, don't write it.${socialConsensusInstruction}${depthInstruction}
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
- Prioritize COMPLETENESS over brevity. Missing a major story that your readers will hear about elsewhere is the worst outcome. Always do at least two rounds of searches.
</search-queries>

<workflow>
1. In your FIRST response, call searchWeb multiple times in parallel with diverse queries covering different angles of the newsletter topics. Aim for 5-7 parallel searches to cast a WIDE net. It's better to search too broadly than to miss a major story.
2. Review the results. Do a SECOND round of 2-4 follow-up searches to fill gaps: any major topic area from the keywords with thin or zero coverage, and any breaking stories worth drilling into for more details.${blueskyInstruction}
3. Review again. If any major topic area still has no coverage, do one more targeted round. Otherwise, proceed to submitAnswer.
${submitStep}. Call submitAnswer with the fully written newsletter.

IMPORTANT: You MUST always call submitAnswer as the final step. Every response path must end with submitAnswer — never stop without it. If you are running low on steps, skip additional searches and submit with what you have.
IMPORTANT: Thoroughness matters more than speed. Missing a major story is worse than doing an extra search. When in doubt, search more.
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
