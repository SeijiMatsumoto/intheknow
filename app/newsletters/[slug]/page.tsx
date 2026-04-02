import { auth } from "@clerk/nextjs/server";
import { format } from "date-fns";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BottomNav } from "@/components/layout/bottom-nav";
import { LocalTime } from "@/components/common/local-time";
import { NewsletterHeader } from "@/components/newsletters/newsletter-header";
import { DeleteNewsletterButton } from "@/components/newsletters/delete-newsletter-button";
import { SubscribeButton } from "@/components/newsletters/subscribe-button";
import { SubscriptionRow } from "@/components/newsletters/subscription-row";
import { getCategory } from "@/lib/categories";
import type { Frequency } from "@/lib/date-utils";
import { canUse } from "@/lib/gates";
import { prisma } from "@/lib/prisma";
import { nextRunDate } from "@/lib/schedule";

export default async function NewsletterDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { userId } = await auth();

  const newsletter = await prisma.newsletter.findUnique({
    where: { slug },
  });

  if (!newsletter) notFound();
  if (newsletter.createdBy !== null && newsletter.createdBy !== userId)
    notFound();

  const [subscription, canCustomize, pastRuns] = await Promise.all([
    userId
      ? prisma.subscription.findFirst({
          where: { userId, newsletterId: newsletter.id },
        })
      : null,
    userId ? canUse(userId, "custom_schedule") : false,
    prisma.digestRun.findMany({
      where: { newsletterId: newsletter.id, status: "sent" },
      orderBy: { runAt: "desc" },
      take: 10,
      select: { id: true, runAt: true, content: true },
    }),
  ]);

  const cat = getCategory(newsletter.categoryId);

  const nextRun = nextRunDate(
    newsletter.scheduleDays,
    newsletter.scheduleHour,
    subscription?.scheduleDays ?? [],
    subscription?.scheduleHour ?? null,
  );

  return (
    <div className="min-h-screen bg-background">
      <NewsletterHeader />

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 pb-12 sm:py-8 sm:pb-16">
        {/* Back + actions row */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/newsletters"
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
          >
            ← All newsletters
          </Link>

          <div className="hidden sm:flex items-center gap-3">
            {newsletter.createdBy !== null && (
              <DeleteNewsletterButton
                newsletterId={newsletter.id}
                newsletterTitle={newsletter.title}
                className="border-none px-2 py-1.5 text-xs text-muted-foreground/50 hover:text-destructive hover:bg-transparent"
              />
            )}
            <SubscribeButton
              newsletterId={newsletter.id}
              subscriptionId={subscription?.id ?? null}
            />
          </div>
        </div>

        {/* Masthead */}
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
            {cat.label} · {newsletter.frequency}
          </p>

          <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground sm:text-5xl text-balance">
            {newsletter.title}
          </h1>

          {newsletter.description && (
            <p className="mt-4 text-base sm:text-lg text-muted-foreground text-pretty leading-relaxed">
              {newsletter.description}
            </p>
          )}

          {/* Keywords */}
          {newsletter.keywords.length > 0 && (
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {newsletter.keywords.slice(0, 3).map((kw) => (
                <span
                  key={kw}
                  className="border border-border px-2.5 py-1 text-xs text-muted-foreground"
                >
                  {kw}
                </span>
              ))}
              {newsletter.keywords.length > 3 && (
                <span className="border border-transparent px-2.5 py-1 text-xs text-muted-foreground">
                  +{newsletter.keywords.length - 3} more
                </span>
              )}
            </div>
          )}

          <div className="mt-6 border-t border-border py-4 flex justify-center">
            {subscription ? (
              <SubscriptionRow
                subscriptionId={subscription.id}
                frequency={newsletter.frequency as Frequency}
                newsletterDays={newsletter.scheduleDays}
                newsletterHour={newsletter.scheduleHour}
                currentDays={subscription.scheduleDays}
                currentHour={subscription.scheduleHour}
                nextRunIso={nextRun.toISOString()}
                canCustomize={canCustomize}
              />
            ) : (
              <p className="text-xs text-muted-foreground">
                {newsletter.frequency === "daily" ? "Daily" : "Weekly"} at{" "}
                <span className="font-medium text-foreground">
                  <LocalTime utcHour={newsletter.scheduleHour} />
                </span>
                {" · "}Next:{" "}
                <span className="font-medium text-foreground">
                  {format(nextRun, "EEE, MMM d")}
                </span>
              </p>
            )}
          </div>

          {/* Mobile subscribe */}
          <div className="mt-0 sm:mt-6 sm:hidden space-y-2">
            <SubscribeButton
              newsletterId={newsletter.id}
              subscriptionId={subscription?.id ?? null}
              className="w-full"
            />
            {newsletter.createdBy !== null && (
              <DeleteNewsletterButton
                newsletterId={newsletter.id}
                newsletterTitle={newsletter.title}
                className="w-full justify-center"
              />
            )}
          </div>
        </div>

        {/* Thin decorative rule */}
        <div className="border-t border-foreground/20 mb-6 sm:mb-8" />

        {/* Past editions */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6">
            Past editions
          </h2>

          {pastRuns.length > 0 ? (
            <div className="divide-y divide-border">
              {pastRuns.map((run) => {
                const content = run.content as {
                  editionTitle?: string;
                  title?: string;
                  summary?: string;
                } | null;
                const title =
                  content?.editionTitle ?? content?.title ?? "Untitled edition";
                const summary = content?.summary;
                const date = format(new Date(run.runAt), "MMM d, yyyy");

                return (
                  <Link
                    key={run.id}
                    href={`/digests/${run.id}`}
                    className="group flex items-start gap-4 py-5 transition-colors"
                  >
                    <p className="w-24 shrink-0 text-xs text-muted-foreground pt-0.5">
                      {date}
                    </p>
                    <div className="flex-1 min-w-0">
                      <p className="font-serif font-semibold text-foreground group-hover:underline decoration-foreground/30 underline-offset-2">
                        {title}
                      </p>
                      {summary && (
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                          {summary}
                        </p>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/30 group-hover:text-foreground transition-colors mt-1" />
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No editions have been sent yet. Subscribe to get notified when the
              first one goes out.
            </p>
          )}
        </section>
      </main>

      <footer className="border-t border-border mt-16 mb-16 sm:mb-0">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <p className="text-center text-sm text-muted-foreground">
            Unsubscribe anytime. We respect your inbox.
          </p>
        </div>
      </footer>

      {userId && <BottomNav />}
    </div>
  );
}
