/**
 * Pro feature gating.
 *
 * All features are currently unlocked for everyone.
 * When billing is ready:
 *   1. Uncomment the plan check in `canUse`
 *   2. Flip `GATING_ENABLED` to true
 *   3. Features in `FREE_FEATURES` remain available to free users
 */

import { getUserPlan, isAdmin, isPro } from "./user";

export type ProFeature =
  | "custom_schedule" // customize delivery days per subscription
  | "digest_length" // choose brief / standard / deep_dive
  | "custom_newsletter" // create custom newsletters
  | "multiple_newsletters"; // subscribe to more than the free-tier limit

const FREE_FEATURES = new Set<ProFeature>([
  // add features here when you want to open them to free users
]);

const GATING_ENABLED = false;

export async function canUse(
  userId: string,
  feature: ProFeature,
): Promise<boolean> {
  if (!GATING_ENABLED) return true;
  if (FREE_FEATURES.has(feature)) return true;
  const plan = await getUserPlan(userId);
  return isAdmin(plan) || isPro(plan);
}
