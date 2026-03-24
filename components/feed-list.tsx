"use client";

import { format } from "date-fns";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { getCategory } from "@/lib/categories";
import { cn } from "@/lib/utils";

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
          className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
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

                return (
                  <Link
                    key={send.id}
                    href={`/feed/${run.id}`}
                    className="group block rounded-xl border border-border bg-card p-4 transition-all hover:border-muted-foreground/30 hover:bg-secondary/50 sm:p-6"
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10",
                          cat.bg,
                        )}
                      >
                        <CatIcon
                          className={cn(
                            "h-4 w-4 sm:h-5 sm:w-5",
                            cat.color,
                          )}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-medium text-muted-foreground">
                          {run.newsletter.title}
                        </span>

                        <p className="mt-0.5 text-sm font-semibold text-foreground transition-colors group-hover:text-accent sm:mt-1 sm:text-base">
                          {content?.editionTitle ??
                            content?.title ??
                            run.newsletter.title}
                        </p>

                        {content?.summary && (
                          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:mt-2 sm:text-sm">
                            {content.summary}
                          </p>
                        )}

                        {content?.keyTakeaways &&
                          content.keyTakeaways.length > 0 && (
                            <p className="mt-2 text-xs text-muted-foreground/70 sm:mt-3">
                              {content.keyTakeaways.length} key takeaways ·{" "}
                              {content.sections?.length ?? 0} sections
                            </p>
                          )}
                      </div>
                    </div>
                  </Link>
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
            className="rounded-md border border-input bg-background px-6 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            See more
          </button>
        </div>
      )}
    </div>
  );
}
