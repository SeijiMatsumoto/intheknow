import { formatDistanceToNow, nextDay } from "date-fns";
import { CalendarDays, Inbox, Newspaper } from "lucide-react";
import Link from "next/link";
import type { FeedStats } from "@/app/feed/data";
import { getCategory } from "@/lib/categories";
import { cn } from "@/lib/utils";

const DAY_MAP: Record<string, 0 | 1 | 2 | 3 | 4 | 5 | 6> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

function getNextDelivery(
  scheduleDays: string[],
  scheduleHour: number,
): Date | null {
  if (scheduleDays.length === 0) return null;

  const now = new Date();
  const currentDay = now.getUTCDay();
  const currentHour = now.getUTCHours();

  // Find the next scheduled day
  type DayNum = 0 | 1 | 2 | 3 | 4 | 5 | 6;
  const dayNumbers = scheduleDays
    .map((d) => DAY_MAP[d])
    .filter((d): d is DayNum => d !== undefined)
    .sort((a, b) => a - b);

  if (dayNumbers.length === 0) return null;

  // Check if today is a scheduled day and the hour hasn't passed
  if (
    dayNumbers.includes(currentDay as 0 | 1 | 2 | 3 | 4 | 5 | 6) &&
    currentHour < scheduleHour
  ) {
    const today = new Date(now);
    today.setUTCHours(scheduleHour, 0, 0, 0);
    return today;
  }

  // Find next day after today
  const nextDayNum = dayNumbers.find((d) => d > currentDay) ?? dayNumbers[0];

  const next = nextDay(now, nextDayNum as 0 | 1 | 2 | 3 | 4 | 5 | 6);
  next.setUTCHours(scheduleHour, 0, 0, 0);
  return next;
}

type FeedSidebarProps = {
  stats: FeedStats;
};

export function FeedSidebar({ stats }: FeedSidebarProps) {
  return (
    <div className="space-y-6">
      {/* Activity stats */}
      <div className="border border-border bg-card p-5">
        <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
          Activity
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Inbox className="h-3.5 w-3.5" />
              <span className="text-xs">Total digests</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {stats.totalDigests}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" />
              <span className="text-xs">This week</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {stats.digestsThisWeek}
            </p>
          </div>
        </div>
      </div>

      {/* Subscriptions */}
      <div className="border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
            Active Subscriptions
          </h3>
          <Link
            href="/newsletters"
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Browse
          </Link>
        </div>

        {stats.subscriptions.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No active subscriptions.
          </p>
        ) : (
          <div className="space-y-3">
            {stats.subscriptions.map((sub) => {
              const cat = getCategory(sub.categoryId);
              const CatIcon = cat.icon;
              const nextDelivery = getNextDelivery(
                sub.scheduleDays,
                sub.scheduleHour,
              );

              return (
                <div
                  key={sub.newsletterSlug}
                  className="flex items-start gap-3"
                >
                  <div
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                      cat.bg,
                    )}
                  >
                    <CatIcon className={cn("h-3.5 w-3.5", cat.color)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {sub.newsletterTitle}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
                      <span className="capitalize">{sub.frequency}</span>
                      {sub.lastSentAt && (
                        <>
                          <span>·</span>
                          <span>
                            Last{" "}
                            {formatDistanceToNow(new Date(sub.lastSentAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </>
                      )}
                    </div>
                    {nextDelivery && (
                      <p className="text-xs text-muted-foreground/40">
                        Next{" "}
                        {formatDistanceToNow(nextDelivery, {
                          addSuffix: true,
                        })}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
