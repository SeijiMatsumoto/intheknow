import type { CandidateItem } from "./types";

const SCORE_THRESHOLD = 4.0;

const DIGEST_LENGTH_LIMITS: Record<string, number> = {
  brief: 5,
  standard: 12,
  deep_dive: 25,
};

export function filterItems(
  items: CandidateItem[],
  digestLength = "standard"
): CandidateItem[] {
  const limit = DIGEST_LENGTH_LIMITS[digestLength] ?? 12;
  return items
    .filter((item) => item.freshnessScore > 0 && item.combinedScore >= SCORE_THRESHOLD)
    .sort((a, b) => b.combinedScore - a.combinedScore)
    .slice(0, limit);
}
