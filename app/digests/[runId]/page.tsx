import { auth } from "@clerk/nextjs/server";
import { format, parseISO } from "date-fns";
import { Lock, Sparkles } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getDigestIcon, stripEmoji } from "@/lib/digest-icons";
import { NewsletterHeader } from "@/components/newsletter-header";
import { canUsePlan } from "@/lib/gates";
import { getUserPlan, isAdmin } from "@/lib/user";
import {
  type DigestContent,
  type DigestItem,
  type DigestSource,
  getFeedDigest,
} from "../data";

function formatDate(iso: string): string {
  try {
    return format(parseISO(iso), "MMMM d, yyyy");
  } catch {
    return iso;
  }
}

/** Format a publishedAt value as "Mar 25, 2026". Returns null if not a parseable date. */
function formatPublishedAt(value: string): string | null {
  try {
    const date = parseISO(value);
    if (!isNaN(date.getTime())) {
      return format(date, "MMM d, yyyy");
    }
  } catch {
    // not a valid ISO date
  }
  return null;
}

/** Get the first parseable publishedAt from a story's sources. */
function getStoryDate(sources: DigestSource[]): string | null {
  for (const s of sources) {
    if (s.publishedAt) {
      const formatted = formatPublishedAt(s.publishedAt);
      if (formatted) return formatted;
    }
  }
  return null;
}

/** Extract sources from a digest item, handling both old and new schema. */
function getItemSources(item: DigestItem): DigestSource[] {
  if (item.sources && item.sources.length > 0) return item.sources;
  if (item.url)
    return [
      {
        url: item.url,
        name: item.source ?? "Source",
        publishedAt: item.publishedAt,
      },
    ];
  return [];
}

function SourceRow({ sources }: { sources: DigestSource[] }) {
  if (sources.length === 0) return null;
  const storyDate = getStoryDate(sources);
  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground/50">
      {storyDate && (
        <>
          <time className="text-muted-foreground/70 font-medium">{storyDate}</time>
          <span className="text-muted-foreground/30">|</span>
        </>
      )}
      {sources.map((s, i) => (
        <span key={s.url}>
          {i > 0 && <span className="mr-1.5">·</span>}
          <a
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-border underline-offset-2 hover:text-foreground transition-colors"
          >
            {s.name}
          </a>
        </span>
      ))}
    </div>
  );
}

function StoryItem({
  item,
  full,
}: {
  item: DigestItem;
  full: boolean;
}) {
  const sources = getItemSources(item);
  const ItemIcon = getDigestIcon(item.icon);

  return (
    <div>
      {item.category && (
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
          {item.category}
        </p>
      )}
      <p className="font-serif text-[15px] font-semibold leading-snug text-foreground flex items-start gap-2">
        {ItemIcon && (
          <ItemIcon className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
        )}
        {stripEmoji(item.title)}
      </p>
      {full && (
        <>
          {item.detail && (
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              {item.detail}
            </p>
          )}
          {item.quote && (
            <blockquote className="mt-2.5 border-l-2 border-foreground/20 pl-3.5 font-serif text-[13px] italic leading-snug text-muted-foreground">
              &ldquo;{item.quote}&rdquo;
            </blockquote>
          )}
          <div className="mt-2.5">
            <SourceRow sources={sources} />
          </div>
        </>
      )}
      {!full && sources.length > 0 && (
        <div className="mt-1.5">
          <SourceRow sources={sources} />
        </div>
      )}
    </div>
  );
}

function SectionRule({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 py-1">
      <div className="h-px flex-1 bg-foreground/15" />
      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/60 shrink-0">
        {label}
      </span>
      <div className="h-px flex-1 bg-foreground/15" />
    </div>
  );
}

export default async function FeedDetailPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/");

  const plan = await getUserPlan(userId);
  const send = await getFeedDigest(runId, userId, isAdmin(plan));

  if (!send) notFound();

  const content = send.run.content as DigestContent | null;
  if (!content) notFound();

  const hasFullAccess = canUsePlan(plan, "full_digest");

  const sentDate = send.sentAt
    ? format(new Date(send.sentAt), "EEEE, MMMM d, yyyy")
    : null;

  const title = content.editionTitle ?? content.title;


  return (
    <div className="min-h-screen bg-background">
      <NewsletterHeader />

      <div className="mx-auto max-w-5xl px-4 py-8 pb-24 sm:px-6 sm:pb-8">
        <Link
          href="/digests"
          className="mb-6 inline-block text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
        >
          ← My Digests
        </Link>

        {/* ── Nameplate ─────────────────────────────────────────── */}
        <div className="text-center mb-1">
          <div className="border-t-2 border-foreground mb-3" />
          <p className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            In The Know
          </p>
          <div className="border-t border-foreground/20 mt-3 mb-2" />
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50">
            {send.run.newsletter.title} · {sentDate ?? format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
          <div className="border-t border-foreground/20 mt-2" />
        </div>

        {/* ── Headline ──────────────────────────────────────────── */}
        <div className="text-center py-6 sm:py-8">
          <h1 className="font-serif text-2xl sm:text-4xl font-bold leading-tight text-foreground text-balance">
            {title}
          </h1>
          <p className="mt-3 sm:mt-4 mx-auto max-w-2xl text-sm sm:text-base leading-relaxed text-muted-foreground">
            {content.summary}
          </p>
        </div>

        {/* ── In this edition ───────────────────────────────────── */}
        {content.keyTakeaways?.length > 0 && (
          <div className="border-y border-foreground/15 py-4 mb-6 sm:mb-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/50 mb-3 text-center">
              In this edition
            </p>
            <div className="mx-auto max-w-2xl space-y-1.5">
              {content.keyTakeaways.map((t, i) => (
                <p
                  key={t}
                  className="text-[13px] leading-snug text-foreground/80 text-center"
                >
                  <span className="text-muted-foreground/40 font-serif italic mr-1.5">{i + 1}.</span>
                  {t}
                </p>
              ))}
            </div>
          </div>
        )}

        {hasFullAccess ? (
          <>
            {/* ── Stories by section (2-col on desktop) ───────── */}
            {(content.sections ?? []).map((section) => (
              <div key={section.heading}>
                <div className="mt-6 sm:mt-8">
                  <SectionRule label={section.heading} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2">
                  {section.items.map((item, idx) => {
                    const isLast = idx === section.items.length - 1;
                    const isOddLast = isLast && section.items.length % 2 === 1;
                    return (
                      <div
                        key={item.sources?.[0]?.url ?? idx}
                        className={`py-5 sm:py-6 border-b border-foreground/10 ${
                          isOddLast
                            ? "sm:col-span-2"
                            : idx % 2 === 0
                              ? "sm:pr-6 sm:border-r sm:border-r-foreground/10"
                              : "sm:pl-6"
                        }`}
                      >
                        <StoryItem item={item} full />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* ── The public square (social consensus) ────────── */}
            {content.socialConsensus && (
              <div className="mt-6 sm:mt-8">
                <SectionRule label="The Public Square" />
                <div className="py-5 sm:py-6">
                  <p className="text-sm leading-relaxed text-muted-foreground mb-5">
                    {content.socialConsensus.overview}
                  </p>
                  <div className="space-y-4">
                    {content.socialConsensus.highlights.map((h) => (
                      <div key={h.url}>
                        <p className="font-serif text-[14px] leading-snug text-foreground/80 italic">
                          &ldquo;{h.text}&rdquo;
                        </p>
                        <p className="mt-1.5 text-xs text-muted-foreground/50">
                          —{" "}
                          <a
                            href={h.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-foreground hover:underline transition-colors"
                          >
                            {h.authorName}
                          </a>{" "}
                          {h.author}
                          {h.engagement && (
                            <span> · {h.engagement}</span>
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Editor's note (bottom line) ─────────────────── */}
            {content.bottomLine && (
              <div className="mt-6 sm:mt-8 border border-foreground/15 px-5 sm:px-8 py-5 sm:py-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/50 mb-2">
                  Editor&apos;s Note
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {content.bottomLine}
                </p>
              </div>
            )}
          </>
        ) : (
          /* ── Locked view ──────────────────────────────────────── */
          <>
            {content.sections?.map((section) => (
              <div key={section.heading}>
                <div className="mt-6 sm:mt-8">
                  <SectionRule label={section.heading} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2">
                  {section.items.map((item, idx) => {
                    const sources = getItemSources(item);
                    const primary = sources[0];
                    const ItemIcon = getDigestIcon(item.icon);
                    const isLast = idx === section.items.length - 1;
                    const isOddLast = isLast && section.items.length % 2 === 1;
                    return (
                      <div
                        key={primary?.url ?? idx}
                        className={`py-4 border-b border-foreground/10 ${
                          isOddLast
                            ? "sm:col-span-2"
                            : idx % 2 === 0
                              ? "sm:pr-6 sm:border-r sm:border-r-foreground/10"
                              : "sm:pl-6"
                        }`}
                      >
                        <p className="flex items-start gap-2 font-serif text-[15px] font-semibold leading-snug text-foreground">
                          {ItemIcon && (
                            <ItemIcon className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                          )}
                          {stripEmoji(item.title)}
                        </p>
                        {sources.length > 0 && (
                          <div className="mt-1.5">
                            <SourceRow sources={sources} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Upgrade CTA */}
            <div className="mt-8 border border-foreground/15 px-6 sm:px-10 py-8">
              <div className="flex flex-col items-center text-center">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-border">
                  <Lock className="h-4 w-4 text-foreground/70" />
                </div>
                <p className="font-serif text-sm font-semibold text-foreground">
                  Unlock full analysis
                </p>
                <p className="mt-1.5 max-w-xs text-xs text-muted-foreground">
                  AI-generated commentary, key quotes, and &ldquo;The Bottom
                  Line&rdquo; are available on Pro.
                </p>
                <Link
                  href="/settings"
                  className="mt-4 inline-flex items-center gap-1.5 bg-foreground px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-background transition-opacity hover:opacity-80"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Upgrade to Pro
                </Link>
              </div>
            </div>
          </>
        )}

        {/* ── Footer ────────────────────────────────────────────── */}
        <div className="mt-8 sm:mt-12 border-t-2 border-foreground pt-4 text-center">
          <p className="font-serif text-sm font-bold text-foreground">
            In The Know
          </p>
          <p className="mt-2 text-[11px] text-muted-foreground/40">
            You subscribed to{" "}
            <strong className="text-muted-foreground/60">
              {send.run.newsletter.title}
            </strong>{" "}
            on In The Know.
          </p>
        </div>
      </div>
    </div>
  );
}
