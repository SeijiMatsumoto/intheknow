import { createLLMAsJudge } from "openevals";

const ACCURACY_PROMPT = `You are evaluating a newsletter digest for hallucinations and factual accuracy.

<newsletter>
{inputs}
</newsletter>

<digest>
{outputs}
</digest>

Check for signs of hallucination or fabrication:

1. **Sources**: Do the URLs look like real publication URLs (proper domains, reasonable paths)? Are made-up or suspicious URLs present?
2. **Quotes**: Do the quotes feel authentic, or do they read like LLM-generated text attributed to real people?
3. **Facts & statistics**: Are specific numbers, dates, or claims presented without sourcing? Do any feel invented?
4. **Story consistency**: Does each story's detail match what its sources would plausibly report?
5. **Attribution**: Are publication names real and matched to correct domains?

A score of 1.0 means no hallucination signals detected — all sources, quotes, and facts appear genuine.
A score of 0.0 means widespread fabrication — fake URLs, invented quotes, made-up statistics.

Note: You cannot verify URLs are live, but you CAN check if they follow real URL patterns (e.g. "techcrunch.com/2026/03/..." is plausible, "techcrunch.com/ai-model-release-today" is suspicious).`;

export const accuracyEvaluator = createLLMAsJudge({
  prompt: ACCURACY_PROMPT,
  model: "openai:gpt-4o-mini",
  feedbackKey: "accuracy",
  continuous: true,
});
