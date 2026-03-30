/**
 * Feature gating & plan limits.
 *
 * ┌─────────────────────────┬──────────┬──────────┬──────────┐
 * │ Feature                 │ Free     │ Plus     │ Pro      │
 * ├─────────────────────────┼──────────┼──────────┼──────────┤
 * │ Curated subscriptions   │ 3        │ 10       │ 20       │
 * │ Full digest (analysis)  │ ✓        │ ✓        │ ✓        │
 * │ Custom schedule         │ ✗        │ ✓        │ ✓        │
 * │ Custom newsletters      │ ✗        │ 3        │ 10       │
 * │ Social consensus        │ ✗        │ ✗        │ ✓        │
 * │ Deep research           │ ✗        │ ✗        │ ✓        │
 * │ Daily cadence (custom)  │ ✗        │ ✗        │ ✓        │
 * └─────────────────────────┴──────────┴──────────┴──────────┘
 *
 * To add a new gated feature:
 *   1. Add it to the Feature type
 *   2. Add its value to each plan in PLAN_CONFIG
 *   3. Use canUse() / canUsePlan() in your code
 *
 * To add a new numeric limit:
 *   1. Add it to the LimitKey type
 *   2. Add its value to each plan in LIMITS
 *   3. Use getLimit() / getLimitForPlan() in your code
 */

import { getUserPlan, type Plan } from "./user";

// ─── Feature registry ────────────────────────────────────────────────

export type Feature =
  | "full_digest" // AI analysis, quotes, bottom line in digests
  | "custom_schedule" // customize delivery days/time per subscription
  | "custom_newsletter" // create custom newsletters
  | "multiple_subscriptions" // subscribe to more than free limit
  | "social_consensus" // "what people are saying" from Bluesky/social
  | "deep_research" // deeper sourcing, more articles, extended analysis
  | "daily_custom"; // allow daily cadence on custom newsletters

// ─── Plan feature config ─────────────────────────────────────────────

type FeatureValue = boolean | number;
type PlanFeatures = Record<Feature, FeatureValue>;

const PLAN_CONFIG: Record<Plan, PlanFeatures> = {
  free: {
    full_digest: true,
    custom_schedule: false,

    custom_newsletter: false,
    multiple_subscriptions: false,
    social_consensus: false,
    deep_research: false,
    daily_custom: false,
  },
  plus: {
    full_digest: true,
    custom_schedule: true,

    custom_newsletter: true,
    multiple_subscriptions: true,
    social_consensus: false,
    deep_research: false,
    daily_custom: false,
  },
  pro: {
    full_digest: true,
    custom_schedule: true,

    custom_newsletter: true,
    multiple_subscriptions: true,
    social_consensus: true,
    deep_research: true,
    daily_custom: true,
  },
  admin: {
    full_digest: true,
    custom_schedule: true,

    custom_newsletter: true,
    multiple_subscriptions: true,
    social_consensus: true,
    deep_research: true,
    daily_custom: true,
  },
};

// ─── Numeric limits ──────────────────────────────────────────────────

export type LimitKey = "max_subscriptions" | "max_custom_newsletters";

const LIMITS: Record<Plan, Record<LimitKey, number>> = {
  free: {
    max_subscriptions: 3,
    max_custom_newsletters: 0,
  },
  plus: {
    max_subscriptions: 10,
    max_custom_newsletters: 3,
  },
  pro: {
    max_subscriptions: 20,
    max_custom_newsletters: 10,
  },
  admin: {
    max_subscriptions: Infinity,
    max_custom_newsletters: Infinity,
  },
};

// ─── Kill switch ─────────────────────────────────────────────────────

const GATING_ENABLED = true;

// ─── Public API ──────────────────────────────────────────────────────

/** Check if a user can use a feature (async — fetches plan). */
export async function canUse(
  userId: string,
  feature: Feature,
): Promise<boolean> {
  if (!GATING_ENABLED) return true;
  const plan = await getUserPlan(userId);
  return canUsePlan(plan, feature);
}

/** Synchronous check when you already have the plan. */
export function canUsePlan(plan: Plan, feature: Feature): boolean {
  if (!GATING_ENABLED) return true;
  const value = PLAN_CONFIG[plan][feature];
  return value === true || (typeof value === "number" && value > 0);
}

/** Get a numeric limit for a user (async — fetches plan). */
export async function getLimit(
  userId: string,
  limit: LimitKey,
): Promise<number> {
  if (!GATING_ENABLED) return Infinity;
  const plan = await getUserPlan(userId);
  return LIMITS[plan][limit];
}

/** Synchronous limit check when you already have the plan. */
export function getLimitForPlan(plan: Plan, limit: LimitKey): number {
  if (!GATING_ENABLED) return Infinity;
  return LIMITS[plan][limit];
}

/** Full config for a plan (for settings/upgrade UI). */
export function getPlanConfig(plan: Plan) {
  return {
    features: PLAN_CONFIG[plan],
    limits: LIMITS[plan],
  };
}

/** All plan configs (for comparison/pricing tables). */
export function getAllPlanConfigs() {
  return (["free", "plus", "pro"] as const).map((plan) => ({
    plan,
    features: PLAN_CONFIG[plan],
    limits: LIMITS[plan],
  }));
}

// Re-export for convenience
export type { Plan };
