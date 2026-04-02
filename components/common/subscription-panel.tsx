"use client";

import Link from "next/link";
import { getCategory } from "@/lib/categories";
import { formatNextRun } from "@/lib/format-schedule";

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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
      {subscriptions.map((sub) => {
        const cat = getCategory(sub.categoryId);
        const CatIcon = cat.icon;
        const nextRun = new Date(sub.nextRunIso);
        const nextRunLabel = formatNextRun(nextRun);

        return (
          <Link
            key={sub.newsletterSlug}
            href={`/newsletters/${sub.newsletterSlug}`}
            className="group flex items-center gap-2.5 rounded-lg border border-border/60 bg-card px-3 py-2.5 hover:border-foreground/20 transition-colors"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-secondary">
              <CatIcon className="h-3.5 w-3.5 text-foreground/70" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-foreground truncate">
                {sub.newsletterTitle}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {nextRunLabel} ·{" "}
                <span className="capitalize">{sub.frequency}</span>
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
