"use client";

import { format, isToday, isTomorrow } from "date-fns";
import { Lock } from "lucide-react";
import { useState } from "react";
import { ScheduleEditor } from "@/components/newsletters/schedule-editor";

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

function toLocalDays(utcDays: string[], nextRun: Date): string[] {
  const shift = nextRun.getDay() - nextRun.getUTCDay();
  const adjusted = shift > 3 ? shift - 7 : shift < -3 ? shift + 7 : shift;
  return utcDays
    .map((d) => UTC_DAYS[(UTC_DAYS.indexOf(d) + adjusted + 7) % 7])
    .sort((a, b) => UTC_DAYS.indexOf(a) - UTC_DAYS.indexOf(b));
}

function formatScheduleLabel(localDays: string[], nextRun: Date): string {
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

function formatNextRun(nextRun: Date): string {
  const timeStr = format(nextRun, "h:mmaaa");
  if (isToday(nextRun)) return `Today at ${timeStr}`;
  if (isTomorrow(nextRun)) return `Tomorrow at ${timeStr}`;
  return format(nextRun, `EEE MMM d 'at' h:mmaaa`);
}

type Props = {
  subscriptionId: string;
  frequency: string;
  newsletterDays: string[];
  newsletterHour: number;
  currentDays: string[];
  currentHour: number | null;
  nextRunIso: string;
  canCustomize: boolean;
};

export function SubscriptionRow({
  subscriptionId,
  frequency,
  newsletterDays,
  newsletterHour,
  currentDays,
  currentHour,
  nextRunIso,
  canCustomize,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [showUpgradeNudge, setShowUpgradeNudge] = useState(false);

  const nextRun = new Date(nextRunIso);
  const effectiveDays = currentDays.length > 0 ? currentDays : newsletterDays;
  const localDays = toLocalDays(effectiveDays, nextRun);
  const scheduleLabel = formatScheduleLabel(localDays, nextRun);
  const nextRunLabel = formatNextRun(nextRun);

  return (
    <div className="mt-2">
      <div className="flex items-center gap-3 text-xs text-zinc-400">
        <span>{scheduleLabel}</span>
        <span>·</span>
        <span className="text-zinc-500">Next: {nextRunLabel}</span>
        <span>·</span>
        {canCustomize ? (
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="text-zinc-400 underline underline-offset-2 hover:text-zinc-700"
          >
            {editing ? "Cancel" : "Customize"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowUpgradeNudge((v) => !v)}
            className="flex items-center gap-1 text-zinc-400 underline underline-offset-2 hover:text-zinc-700"
          >
            <Lock className="h-3 w-3" />
            Customize
          </button>
        )}
      </div>
      {showUpgradeNudge && !canCustomize && (
        <div className="mt-3 flex items-start gap-3 rounded-lg border border-border bg-secondary/50 px-4 py-3">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">Pro feature</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Upgrade to Pro to customize delivery days and time for each
              newsletter.
            </p>
          </div>
        </div>
      )}
      {editing && (
        <ScheduleEditor
          subscriptionId={subscriptionId}
          frequency={frequency}
          newsletterDays={newsletterDays}
          newsletterHour={newsletterHour}
          currentDays={currentDays}
          currentHour={currentHour}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}
