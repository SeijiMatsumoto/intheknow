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

/** Date range for Twitter advanced search (yyyy-MM-dd format). */
export function twitterDateRange(frequency: Frequency): {
  since: string;
  until: string;
} {
  const now = new Date();
  return {
    since: format(subDays(now, WINDOW_DAYS[frequency]), "yyyy-MM-dd"),
    until: format(now, "yyyy-MM-dd"),
  };
}
