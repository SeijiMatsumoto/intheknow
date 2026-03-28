"use client";

import { Lock } from "lucide-react";
import { useState } from "react";
import type { Frequency } from "@/lib/frequency";
import {
  formatNextRun,
  formatScheduleLabel,
  toLocalDays,
} from "@/lib/format-schedule";
import { ScheduleEditor } from "@/components/newsletters/schedule-editor";

type Props = {
  subscriptionId: string;
  frequency: Frequency;
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
