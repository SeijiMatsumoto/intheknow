const UTC_DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

/**
 * Returns the effective delivery days for a subscription.
 * If the user has set custom days, those act as a filter on the newsletter's schedule.
 * Otherwise the user receives all newsletter runs.
 */
export function effectiveDays(newsletterDays: string[], subDays: string[]): string[] {
  if (subDays.length === 0) return newsletterDays;
  return newsletterDays.filter((d) => subDays.includes(d));
}

/**
 * Returns the next UTC Date when this subscription will receive a digest.
 * Formatting is intentionally left to the client (timezone-aware).
 */
export function nextRunDate(
  newsletterDays: string[],
  newsletterHour: number,
  subDays: string[],
  subHour?: number | null,
): Date {
  const days = subDays.length > 0 ? subDays : newsletterDays;
  const hour = subHour ?? newsletterHour;
  if (days.length === 0) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const now = new Date();
  for (let i = 0; i < 8; i++) {
    const candidate = new Date(now);
    candidate.setUTCDate(now.getUTCDate() + i);
    candidate.setUTCHours(hour, 0, 0, 0);
    const dayName = UTC_DAYS[candidate.getUTCDay()];
    if (days.includes(dayName) && candidate > now) return candidate;
  }
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
}
