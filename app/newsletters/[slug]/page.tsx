import { auth } from "@clerk/nextjs/server";
import { format } from "date-fns";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BottomNav } from "@/components/bottom-nav";
import { LocalTime } from "@/components/local-time";
import { DeleteNewsletterButton } from "@/components/newsletters/delete-newsletter-button";
import { SubscribeButton } from "@/components/newsletters/subscribe-button";
import { SubscriptionRow } from "@/components/newsletters/subscription-row";
import { getCategory } from "@/lib/categories";
import type { Frequency } from "@/lib/frequency";
import { canUse } from "@/lib/gates";
import { prisma } from "@/lib/prisma";
import { nextRunDate } from "@/lib/schedule";

const DAY_LABELS: Record<string, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

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
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background">
        <div className="mx-auto flex h-14 sm:h-16 max-w-5xl items-center justify-between px-6">
          <Link
            href="/newsletters"
            className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">All newsletters</span>
          </Link>

          <Link href="/" className="absolute left-1/2 -translate-x-1/2">
            <span className="font-serif text-sm font-bold text-foreground">
              ITK Dispatch
            </span>
          </Link>

          <div className="hidden sm:flex items-center gap-2">
            <SubscribeButton
              newsletterId={newsletter.id}
              subscriptionId={subscription?.id ?? null}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8 pb-24 sm:py-16 sm:pb-16">
        {/* Masthead */}
        <div className="mx-auto max-w-5xl text-center mb-8 sm:mb-10">
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

          <div className="mt-6 border-t border-border pt-4 flex flex-col items-center gap-3">
            <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
              {!subscription && (
                <span>
                  Next delivery:{" "}
                  <span className="font-medium text-foreground">
                    {format(nextRun, "EEE, MMM d")}
                  </span>
                </span>
              )}
              <span>
                Schedule:{" "}
                <span className="font-medium text-foreground">
                  <LocalTime utcHour={newsletter.scheduleHour} />
                </span>
              </span>
              {newsletter.scheduleDays.length > 0 && (
                <span className="hidden sm:inline">
                  Days:{" "}
                  <span className="font-medium text-foreground">
                    {newsletter.scheduleDays.map((d) => DAY_LABELS[d]).join(", ")}
                  </span>
                </span>
              )}
            </div>

            {subscription && (
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
            )}
          </div>

          {/* Mobile subscribe */}
          <div className="mt-6 sm:hidden space-y-2">
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
        <div className="mx-auto max-w-5xl border-t border-foreground/20 my-8 sm:my-10" />

        {/* Content */}
        <div className="mx-auto max-w-5xl">

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
                    content?.editionTitle ??
                    content?.title ??
                    "Untitled edition";
                  const summary = content?.summary;
                  const date = format(new Date(run.runAt), "MMM d, yyyy");

                  return (
                    <Link
                      key={run.id}
                      href={`/feed/${run.id}`}
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
                No editions have been sent yet. Subscribe to get notified when
                the first one goes out.
              </p>
            )}
          </section>

          {/* Delete (custom newsletters only, desktop) */}
          {newsletter.createdBy !== null && (
            <div className="hidden sm:block mt-12 pt-8 border-t border-border">
              <DeleteNewsletterButton
                newsletterId={newsletter.id}
                newsletterTitle={newsletter.title}
              />
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-border mt-16 mb-16 sm:mb-0">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <p className="text-center text-sm text-muted-foreground">
            Unsubscribe anytime. We respect your inbox.
          </p>
        </div>
      </footer>

      {userId && <BottomNav />}
    </div>
  );
}
