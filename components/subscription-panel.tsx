"use client";

import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { getCategory } from "@/lib/categories";
import {
  formatNextRun,
  formatScheduleLabel,
  toLocalDays,
} from "@/lib/format-schedule";

type Subscription = {
  newsletterTitle: string;
  newsletterSlug: string;
  frequency: string;
  scheduleDays: string[];
  scheduleHour: number;
  categoryId: string;
  categoryLabel: string;
  lastSentAt: string | null;
  nextRunIso: string;
};

type Props = {
  subscriptions: Subscription[];
};

export function SubscriptionPanel({ subscriptions }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
      {subscriptions.map((sub) => {
        const cat = getCategory(sub.categoryId);
        const CatIcon = cat.icon;
        const nextRun = new Date(sub.nextRunIso);
        const localDays = toLocalDays(sub.scheduleDays, nextRun);
        const scheduleLabel = formatScheduleLabel(localDays, nextRun);
        const nextRunLabel = formatNextRun(nextRun);

        return (
          <Link
            key={sub.newsletterSlug}
            href={`/newsletters/${sub.newsletterSlug}`}
            className="group flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4 hover:border-foreground/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                <CatIcon className="h-4 w-4 text-foreground/70" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {sub.newsletterTitle}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {sub.frequency}
                </p>
              </div>
            </div>

            <div className="border-t border-border/40 pt-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{scheduleLabel}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Next: <span className="text-foreground font-medium">{nextRunLabel}</span>
                </span>
                {sub.lastSentAt && (
                  <span className="text-muted-foreground/50">
                    Last {formatDistanceToNow(new Date(sub.lastSentAt), { addSuffix: true })}
                  </span>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
