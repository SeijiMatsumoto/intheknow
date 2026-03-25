import { addDays, format, subDays } from "date-fns";

export type Frequency = "daily" | "weekly";

/** Number of days in the search window for each frequency. */
const WINDOW_DAYS: Record<Frequency, number> = {
  daily: 1,
  weekly: 7,
};

/** Human-readable label for the search window. */
export function windowLabel(frequency: Frequency): string {
  return frequency === "daily" ? "past 24 hours" : "past 7 days";
}

/** Date range for Perplexity Search API (M/d/yyyy format). */
export function perplexityDateRange(frequency: Frequency): {
  after: string;
  before: string;
} {
  const now = new Date();
  return {
    after: format(subDays(now, WINDOW_DAYS[frequency]), "M/d/yyyy"),
    before: format(addDays(now, 1), "M/d/yyyy"),
  };
}

/** Google tbs param for Serper date filtering. */
export function serperDateRange(frequency: Frequency): string {
  return frequency === "daily" ? "qdr:d" : "qdr:w";
}

/** Date range for Bluesky search (ISO 8601 datetime format). */
export function blueskyDateRange(frequency: Frequency): {
  since: string;
  until: string;
} {
  const now = new Date();
  return {
    since: subDays(now, WINDOW_DAYS[frequency]).toISOString(),
    until: now.toISOString(),
  };
}
