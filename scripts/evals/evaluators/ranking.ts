import { createLLMAsJudge } from "openevals";

const RANKING_PROMPT = `You are evaluating whether a newsletter digest orders its stories by importance and impact.

<newsletter>
{inputs}
</newsletter>

<digest_sections>
{outputs}
</digest_sections>

The newsletter is structured as sections, each with ordered items. The first section and its first items should contain the biggest, most impactful stories. Later items and sections should cover less critical news.

Evaluate the ordering:

1. **Lead story**: Is the first item in the first section the most important/breaking story? Would a human editor lead with this?
2. **Section ordering**: Are sections arranged from most to least newsworthy?
3. **Within-section ordering**: Within each section, are items ordered from highest to lowest impact?
4. **Impact signals**: Breaking news, major product launches, and market-moving events should come before routine updates, minor releases, and opinion pieces.
5. **Key takeaways**: Do the keyTakeaways lead with the biggest story?

A score of 1.0 means stories are perfectly ordered — a reader scanning from top to bottom gets the most important news first.
A score of 0.0 means the ordering is random or inverted — minor stories lead while breaking news is buried.`;

export const rankingEvaluator = createLLMAsJudge({
  prompt: RANKING_PROMPT,
  model: "openai:gpt-4o-mini",
  feedbackKey: "ranking",
  continuous: true,
});
