/**
 * Per-tier configuration for digest generation.
 *
 * Controls model selection, research depth, and tool availability
 * for the newsletter agent based on the user's plan tier.
 */

import type { Plan } from "@/lib/user";

export type DigestTierConfig = {
  /** OpenAI model ID for generation. */
  model: string;
  /** Max agentic loop steps. */
  maxSteps: number;
  /** Target story count range (e.g. "6-12"). */
  storyTarget: string;
  /** Include Bluesky social search tool. */
  socialConsensus: boolean;
  /** Extended analysis with more specifics in each item. */
  deepResearch: boolean;
};

const DIGEST_CONFIG: Record<Plan, DigestTierConfig> = {
  free: {
    model: "gpt-5-mini",
    maxSteps: 3,
    storyTarget: "5-8",
    socialConsensus: false,
    deepResearch: false,
  },
  plus: {
    model: "gpt-5.4-mini",
    maxSteps: 6,
    storyTarget: "8-15",
    socialConsensus: false,
    deepResearch: false,
  },
  pro: {
    model: "gpt-5.4",
    maxSteps: 8,
    storyTarget: "10-20",
    socialConsensus: true,
    deepResearch: true,
  },
  admin: {
    model: "gpt-5.4",
    maxSteps: 8,
    storyTarget: "10-20",
    socialConsensus: true,
    deepResearch: true,
  },
};

/** Get digest generation config for a plan tier. */
export function getDigestConfig(tier: Plan): DigestTierConfig {
  return DIGEST_CONFIG[tier];
}
