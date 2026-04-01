import { createLLMAsJudge } from "openevals";

const TOOL_USAGE_PROMPT = `You are evaluating whether a newsletter agent used its tools correctly.

<newsletter_config>
{inputs}
</newsletter_config>

<tool_call_log>
{outputs}
</tool_call_log>

The agent has these tools:
- **searchWeb(query)**: Search the web for recent news articles. Should be called 4-5 times — 1 broad catch-all query first, then 3-4 topic-specific queries.
- **searchBluesky(queries)**: Search Bluesky for social discussion. Only available on "pro" tier.
- **submitAnswer(digest)**: Submit the final newsletter. Must always be the last tool call.

Evaluate based on:

1. **Search breadth**: Did it call searchWeb 4-5 times? Did it start with a broad query before specific ones?
2. **Query quality**: Are queries diverse (covering different aspects of the topic)? Are they 2-5 word noun phrases (not full sentences or questions)?
3. **No redundancy**: Did it avoid repeating similar queries that would return overlapping results?
4. **Bluesky usage**: If tier is "pro", did it use searchBluesky? If not pro, did it correctly skip it?
5. **Submit last**: Was submitAnswer the final tool call?
6. **No wasted steps**: Did it avoid unnecessary follow-up searches when it already had enough material?

A score of 1.0 means optimal tool usage — good search coverage, diverse queries, correct ordering.
A score of 0.0 means severely broken tool usage — no searches, submitAnswer not called, or completely wrong tool order.`;

export const toolUsageEvaluator = createLLMAsJudge({
  prompt: TOOL_USAGE_PROMPT,
  model: "openai:gpt-4o-mini",
  feedbackKey: "tool_usage",
  continuous: true,
});
