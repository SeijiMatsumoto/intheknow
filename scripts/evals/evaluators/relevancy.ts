import { createLLMAsJudge } from "openevals";

const RELEVANCY_PROMPT = `You are evaluating whether a newsletter digest's stories are relevant to the newsletter's stated topic.

<newsletter>
Title: {inputs}
</newsletter>

<digest>
{outputs}
</digest>

Score the relevancy of the digest's stories to the newsletter's topic, description, and keywords.

Consider:
- Does every story clearly relate to the newsletter's stated topic area?
- Would a subscriber of this specific newsletter expect to see these stories?
- Are there any off-topic filler stories that don't belong?
- Is the framing of each story appropriate for this audience?

A score of 1.0 means every story is clearly on-topic and well-framed for the audience.
A score of 0.0 means the stories are completely unrelated to the newsletter topic.`;

export const relevancyEvaluator = createLLMAsJudge({
  prompt: RELEVANCY_PROMPT,
  model: "openai:gpt-4o-mini",
  feedbackKey: "relevancy",
  continuous: true,
});
