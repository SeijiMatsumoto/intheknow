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

function LeadCard({ send }: { send: FeedSend }) {
  const { run } = send;
  const content = run.content;
  const cat = getCategory(run.newsletter.categoryId);
  const CatIcon = cat.icon;
  const editionTitle =
    content?.editionTitle ?? content?.title ?? run.newsletter.title;
  const sentLabel = send.sentAt
    ? format(new Date(send.sentAt), "h:mma").toLowerCase()
    : null;

  return (
    <div className="group relative border-b-2 border-foreground/15 pb-6 sm:pb-8">
      <Link href={`/digests/${run.id}`} className="absolute inset-0" />

      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border/60">
          <CatIcon className="h-3.5 w-3.5 text-foreground/70" />
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
          {run.newsletter.title}
        </span>
        <span className="text-muted-foreground/30">·</span>
        <span className="text-xs uppercase tracking-wider text-muted-foreground/40">
          {cat.label}
        </span>
      </div>

      <h2 className="font-serif text-xl sm:text-2xl font-bold leading-tight text-foreground group-hover:underline decoration-foreground/20 underline-offset-4">
        {editionTitle}
      </h2>

      {content?.summary && (
        <p className="mt-2 sm:mt-3 text-sm leading-relaxed text-muted-foreground max-w-3xl">
          {content.summary}
        </p>
      )}

      {content?.keyTakeaways && content.keyTakeaways.length > 0 && (
        <ul className="mt-3 space-y-1">
          {content.keyTakeaways.slice(0, 3).map((t) => (
            <li
              key={t}
              className="text-xs leading-snug text-muted-foreground/70 pl-3 border-l-2 border-foreground/10"
            >
              {t}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground/50">
        {sentLabel && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Sent {sentLabel}
          </span>
        )}
        {content?.sections && content.sections.length > 0 && (
          <span>
            {content.sections.length} sections
          </span>
        )}
        <span className="font-medium uppercase tracking-wider text-muted-foreground/60 group-hover:text-foreground transition-colors">
          Read →
        </span>
      </div>
    </div>
  );
}

function CompactCard({ send }: { send: FeedSend }) {
  const { run } = send;
  const content = run.content;
  const cat = getCategory(run.newsletter.categoryId);
  const CatIcon = cat.icon;
  const editionTitle =
    content?.editionTitle ?? content?.title ?? run.newsletter.title;
  const sentLabel = send.sentAt
    ? format(new Date(send.sentAt), "h:mma").toLowerCase()
    : null;

  return (
    <div className="group relative">
      <Link href={`/digests/${run.id}`} className="absolute inset-0" />

      <div className="flex items-center gap-1.5 mb-1.5">
        <CatIcon className="h-3 w-3 text-muted-foreground/50" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
          {run.newsletter.title}
        </span>
      </div>

      <p className="font-serif text-[15px] font-semibold leading-snug text-foreground group-hover:underline decoration-foreground/20 underline-offset-2">
        {editionTitle}
      </p>

      {content?.summary && (
        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {content.summary}
        </p>
      )}

      <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground/40">
        {sentLabel && <span>{sentLabel}</span>}
        {content?.sections && content.sections.length > 0 && (
          <>
            <span>·</span>
            <span>{content.sections.length} sections</span>
          </>
        )}
      </div>
    </div>
  );
}

function DateSection({
  dateKey,
  sends,
  isFirst,
}: {
  dateKey: string;
  sends: FeedSend[];
  isFirst: boolean;
}) {
  const lead = isFirst ? sends[0] : null;
  const rest = isFirst ? sends.slice(1) : sends;

  return (
    <div>
      {/* Date divider */}
      <div className="flex items-center gap-4 py-1 mb-4">
        <div className="h-px flex-1 bg-foreground/15" />
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/50 shrink-0">
          {formatDateHeader(dateKey)}
        </span>
        <div className="h-px flex-1 bg-foreground/15" />
      </div>

      {/* Lead story for first group */}
      {lead && <LeadCard send={lead} />}

      {/* Grid of remaining cards */}
      {rest.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2">
          {rest.map((send, idx) => {
            const isLast = idx === rest.length - 1;
            const isOddLast = isLast && rest.length % 2 === 1;
            return (
              <div
                key={send.id}
                className={`py-4 sm:py-5 border-b border-foreground/10 ${
                  isOddLast
                    ? "sm:col-span-2"
                    : idx % 2 === 0
                      ? "sm:pr-5 sm:border-r sm:border-r-foreground/10"
                      : "sm:pl-5"
                }`}
              >
                <CompactCard send={send} />
              </div>
            );
          })}
        </div>
      )}
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
    <div className="space-y-6">
      {grouped.map(([dateKey, dateSends], i) => (
        <DateSection
          key={dateKey}
          dateKey={dateKey}
          sends={dateSends}
          isFirst={i === 0}
        />
      ))}

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
