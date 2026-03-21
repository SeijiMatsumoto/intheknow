import { auth } from "@clerk/nextjs/server";
import { format, parseISO } from "date-fns";
import { Lock, MessageCircle, Sparkles } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { NewsletterHeader } from "@/components/newsletter-header";
import { canUse } from "@/lib/gates";
import { getUserPlan, isAdmin } from "@/lib/user";
import { type DigestContent, getFeedDigest } from "../data";

function formatDate(iso: string): string {
  try {
    return format(parseISO(iso), "MMMM d, yyyy");
  } catch {
    return iso;
  }
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

  const hasFullAccess = await canUse(userId, "full_digest");

  const sentDate = send.sentAt
    ? format(new Date(send.sentAt), "EEEE, MMMM d, yyyy")
    : null;

  const title = content.editionTitle ?? content.title;

  return (
    <div className="min-h-screen bg-background">
      <NewsletterHeader />

      <div className="mx-auto max-w-[600px] px-4 py-8 pb-24 sm:pb-8">
        <Link
          href="/feed"
          className="mb-6 inline-block text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          ← My Feed
        </Link>

        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {/* Header */}
          <div className="border-b border-border px-6 sm:px-10 pb-6 pt-8">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
              {send.run.newsletter.title}
            </p>
            <h1 className="mb-2.5 text-2xl font-bold leading-tight text-foreground">
              {title}
            </h1>
            <p className="mb-4 text-xs text-muted-foreground/60">
              {sentDate ?? format(new Date(), "MMMM d, yyyy")}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {content.summary}
            </p>
          </div>

          {/* In this edition */}
          {content.keyTakeaways?.length > 0 && (
            <div className="border-b border-border bg-amber-50 px-6 sm:px-10 py-5 dark:bg-amber-950/20">
              <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground/70">
                ⚡ In this edition
              </p>
              <ul className="ml-4 list-disc space-y-1.5">
                {content.keyTakeaways.map((t) => (
                  <li
                    key={t}
                    className="text-[13px] leading-snug text-foreground/80"
                  >
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Sections */}
          {hasFullAccess ? (
            <>
              <div className="pb-6">
                {content.sections?.map((section) => (
                  <div key={section.heading}>
                    <div className="border-y border-border bg-secondary px-6 sm:px-10 py-3">
                      <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        {section.heading}
                      </h2>
                    </div>
                    <div className="divide-y divide-border px-6 sm:px-10">
                      {section.items.map((item) => (
                        <div key={item.url} className="py-6">
                          <p className="mb-1.5 text-xs text-muted-foreground/60">
                            {formatDate(item.publishedAt)} · {item.source}
                          </p>
                          <p className="mb-2.5 text-[15px] font-semibold leading-snug text-foreground">
                            {item.title}
                          </p>
                          {item.plainLead && (
                            <p className="mb-2 text-sm font-semibold leading-relaxed text-foreground/80">
                              {item.plainLead}
                            </p>
                          )}
                          {item.detail && (
                            <p className="mb-2.5 text-[13px] leading-relaxed text-muted-foreground">
                              {item.detail}
                            </p>
                          )}
                          {item.quote && (
                            <blockquote className="mb-2.5 border-l-[3px] border-border pl-3.5 text-[13px] italic leading-snug text-muted-foreground">
                              &ldquo;{item.quote}&rdquo;
                            </blockquote>
                          )}
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold text-muted-foreground underline decoration-border hover:text-foreground transition-colors"
                          >
                            Read more →
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Social consensus (Pro only) */}
              {content.socialConsensus && (
                <div className="border-t border-border bg-blue-50 px-6 sm:px-10 py-6 dark:bg-blue-950/20">
                  <div className="mb-4 flex items-center gap-2">
                    <MessageCircle className="h-3.5 w-3.5 text-blue-400" />
                    <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-blue-400">
                      The discourse
                    </p>
                  </div>
                  <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
                    {content.socialConsensus.overview}
                  </p>
                  <div className="divide-y divide-blue-100 dark:divide-blue-900/30">
                    {content.socialConsensus.highlights.map((h) => (
                      <div key={h.url} className="py-3">
                        <p className="text-[13px] leading-snug text-foreground/80">
                          &ldquo;{h.text}&rdquo;
                        </p>
                        <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                          <a
                            href={h.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-blue-500 hover:text-blue-600 transition-colors"
                          >
                            {h.authorName}
                          </a>
                          <span className="text-muted-foreground/50">
                            {h.author}
                          </span>
                          {h.engagement && (
                            <span className="text-muted-foreground/40">
                              · {h.engagement}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom line */}
              {content.bottomLine && (
                <div className="border-t border-border bg-secondary px-6 py-6">
                  <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground/60">
                    The bottom line
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {content.bottomLine}
                  </p>
                </div>
              )}
            </>
          ) : (
            /* Locked content — titles visible, analysis locked */
            <>
              <div className="pb-2">
                {content.sections?.map((section) => (
                  <div key={section.heading}>
                    <div className="border-y border-border bg-secondary px-6 sm:px-10 py-3">
                      <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        {section.heading}
                      </h2>
                    </div>
                    <div className="divide-y divide-border px-6 sm:px-10">
                      {section.items.map((item) => (
                        <div key={item.url} className="py-4">
                          <p className="mb-1 text-xs text-muted-foreground/60">
                            {formatDate(item.publishedAt)} · {item.source}
                          </p>
                          <p className="text-[15px] font-semibold leading-snug text-foreground">
                            {item.title}
                          </p>
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-block text-xs font-semibold text-muted-foreground underline decoration-border hover:text-foreground transition-colors"
                          >
                            Read source →
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Upgrade CTA */}
              <div className="border-t border-border bg-accent/5 px-6 sm:px-10 py-8">
                <div className="flex flex-col items-center text-center">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
                    <Lock className="h-4 w-4 text-accent" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    Unlock full analysis
                  </p>
                  <p className="mt-1.5 max-w-xs text-xs text-muted-foreground">
                    AI-generated commentary, key quotes, and &ldquo;The Bottom
                    Line&rdquo; are available on Pro.
                  </p>
                  <Link
                    href="/settings"
                    className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Upgrade to Pro
                  </Link>
                </div>
              </div>
            </>
          )}

          {/* Footer */}
          <div className="border-t border-border px-10 py-5 text-center">
            <p className="text-[11px] text-muted-foreground/40">
              You're receiving this because you subscribed to{" "}
              <strong>{send.run.newsletter.title}</strong> on The Latest.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
