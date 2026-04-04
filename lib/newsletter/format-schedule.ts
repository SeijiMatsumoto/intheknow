import { format, isToday, isTomorrow } from "date-fns";

const UTC_DAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const DAY_SHORT: Record<string, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

export function toLocalDays(utcDays: string[], nextRun: Date): string[] {
  const shift = nextRun.getDay() - nextRun.getUTCDay();
  const adjusted = shift > 3 ? shift - 7 : shift < -3 ? shift + 7 : shift;
  return utcDays
    .map((d) => UTC_DAYS[(UTC_DAYS.indexOf(d) + adjusted + 7) % 7])
    .sort((a, b) => UTC_DAYS.indexOf(a) - UTC_DAYS.indexOf(b));
}

export function formatScheduleLabel(
  localDays: string[],
  nextRun: Date,
): string {
  const timeStr = format(nextRun, "h:mmaaa");
  if (localDays.length === 0) return "No scheduled runs";
  if (localDays.length === 7) return `Every day at ${timeStr}`;
  if (
    localDays.length === 5 &&
    !localDays.includes("saturday") &&
    !localDays.includes("sunday")
  )
    return `Weekdays at ${timeStr}`;
  return `Every ${localDays.map((d) => DAY_SHORT[d] ?? d).join(", ")} at ${timeStr}`;
}

export function formatNextRun(nextRun: Date): string {
  const timeStr = format(nextRun, "h:mmaaa");
  if (isToday(nextRun)) return `Today at ${timeStr}`;
  if (isTomorrow(nextRun)) return `Tomorrow at ${timeStr}`;
  return format(nextRun, `EEE MMM d 'at' h:mmaaa`);
}
