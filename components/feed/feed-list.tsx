"use client";

import { format } from "date-fns";
import { ArrowRight, ChevronDown, Clock } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { getCategory } from "@/lib/categories";

type FeedSend = {
  id: string;
  sentAt: string | null;
  run: {
    id: string;
    editionTitle: string | null;
    summary: string | null;
    keyTakeaways: string[];
    sectionCount: number;
    storyCount: number;
    newsletter: {
      title: string;
      slug: string;
      categoryId: string | null;
      frequency: string;
    };
  };
};

type FeedListProps = {
  sends: FeedSend[];
  hasFilters: boolean;
  hasMore: boolean;
  currentLimit: number;
};

function groupByDate(sends: FeedSend[]): [string, FeedSend[]][] {
  const groups = new Map<string, FeedSend[]>();
  for (const send of sends) {
    const key = send.sentAt
      ? format(new Date(send.sentAt), "yyyy-MM-dd")
      : "unknown";
    const group = groups.get(key) ?? [];
    group.push(send);
    groups.set(key, group);
  }
  return Array.from(groups.entries());
}

function formatDateHeader(dateKey: string): string {
  if (dateKey === "unknown") return "Unknown date";
  const date = new Date(dateKey + "T00:00:00");
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return format(date, "EEEE, MMM d");
}

function TimelineCard({ send }: { send: FeedSend }) {
  const [expanded, setExpanded] = useState(false);
  const { run } = send;
  const cat = getCategory(run.newsletter.categoryId);
  const CatIcon = cat.icon;
  const editionTitle = run.editionTitle ?? run.newsletter.title;
  const sentLabel = send.sentAt
    ? format(new Date(send.sentAt), "h:mm a").toLowerCase()
    : null;
  const hasKeyTakeaways = run.keyTakeaways.length > 0;
  const sectionCount = run.sectionCount;
  const storyCount = run.storyCount;

  return (
    <div className="group relative">
      {/* Card body */}
      <div className="rounded-lg border border-border/60 bg-background transition-colors hover:border-foreground/20">
        {/* Main clickable area */}
        <Link href={`/digests/${run.id}`} className="block px-4 py-4 sm:px-5">
          {/* Top row: newsletter badge + time */}
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary">
                <CatIcon className="h-3 w-3 text-foreground/70" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {run.newsletter.title}
              </span>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground/70">
                {run.newsletter.frequency}
              </span>
            </div>
            {sentLabel && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground/50">
                <Clock className="h-3 w-3" />
                {sentLabel}
              </span>
            )}
          </div>

          {/* Headline */}
          <h3 className="text-[15px] sm:text-base font-semibold leading-snug text-foreground group-hover:text-foreground/80 transition-colors">
            {editionTitle}
          </h3>

          {/* Summary */}
          {run.summary && (
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground line-clamp-2">
              {run.summary}
            </p>
          )}

          {/* Footer meta */}
          <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground/50">
            {sectionCount > 0 && <span>{sectionCount} sections</span>}
            {storyCount > 0 && (
              <>
                <span>·</span>
                <span>{storyCount} stories</span>
              </>
            )}
            <span className="ml-auto font-medium text-muted-foreground/60 group-hover:text-foreground transition-colors">
              Read
              <ArrowRight className="ml-1 inline h-3 w-3" />
            </span>
          </div>
        </Link>

        {/* Expandable takeaways */}
        {hasKeyTakeaways && (
          <div className="border-t border-border/40">
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-2.5 sm:px-5 text-[11px] font-medium text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            >
              <span>Key takeaways</span>
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
              />
            </button>
            {expanded && (
              <ul className="px-4 pb-4 sm:px-5 space-y-2">
                {run.keyTakeaways.map((t) => (
                  <li
                    key={t}
                    className="flex gap-2 text-xs leading-relaxed text-muted-foreground"
                  >
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-foreground/30" />
                    {t}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DateGroup({ dateKey, sends }: { dateKey: string; sends: FeedSend[] }) {
  return (
    <div className="relative flex gap-4 sm:gap-6">
      {/* Timeline rail */}
      <div className="flex flex-col items-center pt-1">
        <div className="h-2.5 w-2.5 rounded-full border-2 border-foreground/30 bg-background shrink-0" />
        <div className="w-px flex-1 bg-border/60" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-8 min-w-0">
        {/* Date label */}
        <p className="text-xs font-semibold text-foreground mb-3 -mt-0.5">
          {formatDateHeader(dateKey)}
        </p>

        {/* Cards */}
        <div className="space-y-3">
          {sends.map((send) => (
            <TimelineCard key={send.id} send={send} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function FeedList({
  sends,
  hasFilters,
  hasMore,
  currentLimit,
}: FeedListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSeeMore = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("limit", String(currentLimit + 20));
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams, currentLimit]);

  if (sends.length === 0 && !hasFilters) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg font-medium text-foreground">Nothing here yet</p>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Subscribe to newsletters and your digests will show up here once
          they&apos;re sent.
        </p>
        <Link
          href="/newsletters"
          className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-80"
        >
          Browse newsletters
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  if (sends.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-muted-foreground">
          No digests match these filters.
        </p>
      </div>
    );
  }

  const grouped = groupByDate(sends);

  return (
    <div>
      {grouped.map(([dateKey, dateSends]) => (
        <DateGroup key={dateKey} dateKey={dateKey} sends={dateSends} />
      ))}

      {hasMore && (
        <div className="ml-7 sm:ml-9 pt-2 pb-8">
          <button
            type="button"
            onClick={handleSeeMore}
            className="rounded-lg border border-border bg-background px-6 py-2 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
