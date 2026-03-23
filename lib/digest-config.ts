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

/** Plans that can trigger digest generation (free users cannot). */
export type DigestTier = Exclude<Plan, "free">;

const DIGEST_CONFIG: Record<DigestTier, DigestTierConfig> = {
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

/** Get digest generation config for a plan tier. Falls back to plus if free is passed. */
export function getDigestConfig(tier: Plan): DigestTierConfig {
  if (tier === "free") return DIGEST_CONFIG.plus;
  return DIGEST_CONFIG[tier];
}
