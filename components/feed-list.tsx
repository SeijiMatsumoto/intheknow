"use client";

import { format } from "date-fns";
import { ArrowRight, Clock } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { getCategory } from "@/lib/categories";

type FeedSend = {
  id: string;
  sentAt: string | null;
  run: {
    id: string;
    content: {
      editionTitle?: string;
      title?: string;
      summary?: string;
      keyTakeaways?: string[];
      sections?: { heading: string }[];
    } | null;
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
  return format(date, "EEEE, MMMM d, yyyy");
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
          className="mt-6 inline-flex items-center gap-1.5 border border-foreground bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-80"
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
      {/* Date-grouped feed */}
      <div className="space-y-8">
        {grouped.map(([dateKey, dateSends]) => (
          <div key={dateKey}>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
              {formatDateHeader(dateKey)}
            </h3>
            <div className="space-y-3 sm:space-y-4">
              {dateSends.map((send) => {
                const { run } = send;
                const content = run.content;
                const cat = getCategory(run.newsletter.categoryId);
                const CatIcon = cat.icon;
                const editionTitle =
                  content?.editionTitle ??
                  content?.title ??
                  run.newsletter.title;
                const sentLabel = send.sentAt
                  ? format(new Date(send.sentAt), "h:mma").toLowerCase()
                  : null;

                return (
                  <div
                    key={send.id}
                    className="group relative flex flex-col border border-border bg-card transition-all duration-200 hover:shadow-md hover:border-foreground/25"
                  >
                    <Link
                      href={`/digests/${run.id}`}
                      className="absolute inset-0"
                    />

                    {/* Header: icon + newsletter title + badges */}
                    <div className="flex items-start gap-3 p-5 pb-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border/60">
                        <CatIcon className="h-4 w-4 text-foreground/70" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold uppercase tracking-widest text-foreground">
                          {run.newsletter.title}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <span className="rounded-full border border-foreground/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                            {cat.label}
                          </span>
                          <span className="rounded-full border border-foreground/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                            {run.newsletter.frequency}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Edition title + summary */}
                    <div className="border-t border-border/40 mx-5 pt-4 pb-3">
                      <p className="font-serif text-sm font-semibold text-foreground sm:text-base">
                        {editionTitle}
                      </p>
                      {content?.summary && (
                        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                          {content.summary}
                        </p>
                      )}
                    </div>

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Footer: sent time + read link */}
                    <div className="relative z-10 border-t border-border/40 px-5 py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {sentLabel && <span>Sent {sentLabel}</span>}
                          {content?.sections && content.sections.length > 0 && (
                            <span className="text-muted-foreground/40">
                              · {content.sections.length} sections
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">
                          Read →
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* See more */}
      {hasMore && (
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={handleSeeMore}
            className="border border-border bg-background px-6 py-2 text-xs font-medium uppercase tracking-wider text-foreground transition-colors hover:bg-secondary"
          >
            See more
          </button>
        </div>
      )}
    </div>
  );
}
