/**
 * Per-tier configuration for digest generation.
 *
 * Controls model selection, research depth, and tool availability
 * for the newsletter agent based on the user's plan tier.
 */

import type { Plan } from "./user";

export type DigestTierConfig = {
  /** OpenAI model ID for generation. */
  model: string;
  /** Max agentic loop steps. */
  maxSteps: number;
  /** Target story count range (e.g. "6-12"). */
  storyTarget: string;
  /** Include Twitter/social search tool. */
  socialConsensus: boolean;
  /** Extended analysis with more specifics in each item. */
  deepResearch: boolean;
};

const DIGEST_CONFIG: Record<Plan, DigestTierConfig> = {
  free: {
    model: "gpt-5-mini",
    maxSteps: 2,
    storyTarget: "4-6",
    socialConsensus: false,
    deepResearch: false,
  },
  plus: {
    model: "gpt-5.4-mini",
    maxSteps: 3,
    storyTarget: "6-12",
    socialConsensus: false,
    deepResearch: false,
  },
  pro: {
    model: "gpt-5.4",
    maxSteps: 3,
    storyTarget: "8-15",
    socialConsensus: true,
    deepResearch: true,
  },
  admin: {
    model: "gpt-5.4",
    maxSteps: 3,
    storyTarget: "8-15",
    socialConsensus: true,
    deepResearch: true,
  },
};

/** Get digest generation config for a plan tier. */
export function getDigestConfig(tier: Plan): DigestTierConfig {
  return DIGEST_CONFIG[tier];
}
