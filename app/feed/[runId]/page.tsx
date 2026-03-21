import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { NewsletterHeader } from "@/components/newsletter-header";
import { getUserPlan, isAdmin } from "@/lib/user";
import { type DigestContent, getFeedDigest } from "../data";

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
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

  const sentDate = send.sentAt
    ? new Date(send.sentAt).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const title = content.editionTitle ?? (content as { title?: string }).title;

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
          <div className="border-b border-border px-10 pb-6 pt-8">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
              {send.run.newsletter.title}
            </p>
            <h1 className="mb-2.5 text-2xl font-bold leading-tight text-foreground">
              {title}
            </h1>
            <p className="mb-4 text-xs text-muted-foreground/60">
              {sentDate ?? formatDate(new Date().toISOString().split("T")[0])}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {content.summary}
            </p>
          </div>

          {/* In this edition */}
          {content.keyTakeaways?.length > 0 && (
            <div className="border-b border-border bg-amber-50 px-10 py-5 dark:bg-amber-950/20">
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
          <div className="pb-6">
            {content.sections?.map((section) => (
              <div key={section.heading}>
                <div className="border-y border-border bg-secondary px-10 py-3">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    {section.heading}
                  </h2>
                </div>
                <div className="divide-y divide-border px-10">
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
                          "{item.quote}"
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
