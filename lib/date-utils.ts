import { addDays, format, subDays } from "date-fns";

// ── Days of week ────────────────────────────────────────────────────

export const ALL_DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export type DayOfWeek = (typeof ALL_DAYS)[number];

export const DAY_SHORT: Record<DayOfWeek, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

// ── Timezone helpers ────────────────────────────────────────────────

/** Convert a UTC hour to the equivalent local hour given a timezone offset in minutes. */
export function utcToLocalHour(utcHour: number, offsetMinutes: number): number {
  return (((utcHour - offsetMinutes / 60) % 24) + 24) % 24;
}

/** Convert a local hour to the equivalent UTC hour given a timezone offset in minutes. */
export function localToUtcHour(
  localHour: number,
  offsetMinutes: number,
): number {
  return (((localHour + offsetMinutes / 60) % 24) + 24) % 24;
}

/** Format an hour (0-23) as "8:00 AM" style. */
export function formatHour(h: number): string {
  const period = h >= 12 ? "PM" : "AM";
  const display = h % 12 || 12;
  return `${display}:00 ${period}`;
}

// ── Frequency & date ranges ─────────────────────────────────────────

export type Frequency = "daily" | "weekly";

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
