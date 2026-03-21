import { auth } from "@clerk/nextjs/server";
import { format } from "date-fns";
import { ArrowLeft, Calendar, Clock, Sparkles, Zap } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BottomNav } from "@/components/bottom-nav";
import { DeleteNewsletterButton } from "@/components/newsletters/delete-newsletter-button";
import { SubscribeButton } from "@/components/newsletters/subscribe-button";
import { SubscriptionRow } from "@/components/newsletters/subscription-row";
import type { Frequency } from "@/lib/frequency";
import { getCategory } from "@/lib/categories";
import { canUse } from "@/lib/gates";
import { prisma } from "@/lib/prisma";
import { nextRunDate } from "@/lib/schedule";
import { cn } from "@/lib/utils";

const DAY_LABELS: Record<string, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

function formatHour(hour: number) {
  const h = hour % 12 || 12;
  return `${h}:00${hour < 12 ? "am" : "pm"} UTC`;
}

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

  // 404 if not found, or if it's another user's custom newsletter
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

  const nextRun = nextRunDate(
    newsletter.scheduleDays,
    newsletter.scheduleHour,
    subscription?.scheduleDays ?? [],
    subscription?.scheduleHour ?? null,
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 sm:h-16 max-w-5xl items-center justify-between px-6">
          <Link
            href="/newsletters"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">All newsletters</span>
          </Link>

          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 sm:mr-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent">
                <Zap className="h-3.5 w-3.5 text-accent-foreground" />
              </div>
              <span className="text-sm font-semibold text-foreground">
                ITK
              </span>
            </Link>
            <div className="hidden sm:flex items-center gap-2">
              {newsletter.createdBy !== null && (
                <DeleteNewsletterButton
                  newsletterId={newsletter.id}
                  newsletterTitle={newsletter.title}
                />
              )}
              <SubscribeButton
                newsletterId={newsletter.id}
                subscriptionId={subscription?.id ?? null}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-6 pb-24 sm:py-12 sm:pb-12">
        {/* Hero */}
        <div className="mb-8 sm:mb-12">
          {(() => {
            const cat = getCategory(newsletter.categoryId);
            const CatIcon = cat.icon;
            return (
              <>
                {/* Mobile: icon inline with title */}
                <div className="sm:hidden">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span
                      className={cn(
                        "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
                        cat.pill,
                      )}
                    >
                      <CatIcon className="h-3 w-3" />
                      {cat.label}
                    </span>
                    <span
                      className={cn(
                        "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
                        newsletter.frequency === "daily"
                          ? "border-accent/30 bg-accent/10 text-accent"
                          : "border-muted-foreground/30 text-muted-foreground",
                      )}
                    >
                      {newsletter.frequency === "daily" ? (
                        <Sparkles className="h-3 w-3" />
                      ) : (
                        <Calendar className="h-3 w-3" />
                      )}
                      {newsletter.frequency === "daily" ? "Daily" : "Weekly"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                        cat.bg,
                      )}
                    >
                      <CatIcon className={cn("h-5 w-5", cat.color)} />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground text-balance">
                      {newsletter.title}
                    </h1>
                  </div>

                  {newsletter.description && (
                    <p className="mt-2 text-sm text-muted-foreground text-pretty">
                      {newsletter.description}
                    </p>
                  )}

                  <div className="mt-4 space-y-2">
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

                {/* Desktop: original layout */}
                <div className="hidden sm:block">
                  <div className="flex items-start gap-6">
                    <div
                      className={cn(
                        "flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl",
                        cat.bg,
                      )}
                    >
                      <CatIcon className={cn("h-10 w-10", cat.color)} />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        <span
                          className={cn(
                            "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
                            cat.pill,
                          )}
                        >
                          <CatIcon className="h-3 w-3" />
                          {cat.label}
                        </span>
                        <span
                          className={cn(
                            "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
                            newsletter.frequency === "daily"
                              ? "border-accent/30 bg-accent/10 text-accent"
                              : "border-muted-foreground/30 text-muted-foreground",
                          )}
                        >
                          {newsletter.frequency === "daily" ? (
                            <Sparkles className="h-3 w-3" />
                          ) : (
                            <Calendar className="h-3 w-3" />
                          )}
                          {newsletter.frequency === "daily" ? "Daily" : "Weekly"}
                        </span>
                      </div>

                      <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl text-balance">
                        {newsletter.title}
                      </h1>

                      {newsletter.description && (
                        <p className="mt-4 text-lg text-muted-foreground max-w-2xl text-pretty">
                          {newsletter.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </>
            );
          })()}

          {/* Keywords */}
          {newsletter.keywords.length > 0 && (
            <div className="mt-4 sm:mt-8 flex flex-wrap gap-2">
              {newsletter.keywords.map((kw) => (
                <span
                  key={kw}
                  className="rounded-full bg-secondary px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-muted-foreground"
                >
                  {kw}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Content Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8 order-2 lg:order-1">
            {/* Subscription schedule row (if subscribed) */}
            {subscription && (
              <section className="rounded-2xl border border-border bg-card p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  Your subscription
                </h2>
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
              </section>
            )}

            {/* Past editions */}
            {pastRuns.length > 0 ? (
              <section>
                <h2 className="mb-4 text-lg font-semibold text-foreground">
                  Past editions
                </h2>
                <div className="divide-y divide-border rounded-2xl border border-border bg-card overflow-hidden">
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
                    const date = format(new Date(run.runAt), "EEE, MMM d, yyyy");
                    return (
                      <Link
                        key={run.id}
                        href={`/feed/${run.id}`}
                        className="flex items-start justify-between gap-4 px-6 py-4 hover:bg-secondary/50 transition-colors group"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground mb-1">
                            {date}
                          </p>
                          <p className="font-medium text-foreground group-hover:text-accent transition-colors truncate">
                            {title}
                          </p>
                          {summary && (
                            <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                              {summary}
                            </p>
                          )}
                        </div>
                        <ArrowLeft className="h-4 w-4 shrink-0 rotate-180 text-muted-foreground/40 group-hover:text-accent transition-colors mt-1" />
                      </Link>
                    );
                  })}
                </div>
              </section>
            ) : (
              <section className="rounded-2xl border border-border bg-card p-6">
                <h2 className="text-lg font-semibold text-foreground mb-2">
                  Past editions
                </h2>
                <p className="text-sm text-muted-foreground">
                  No editions have been sent yet. Subscribe to get notified when
                  the first one goes out.
                </p>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6 order-1 lg:order-2">
            {/* Delivery schedule */}
            <section className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Delivery schedule
              </h2>

              <div className="space-y-4">
                <div className="rounded-xl bg-secondary/50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                      <Clock className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {newsletter.frequency === "daily"
                          ? "Every day"
                          : "Once a week"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatHour(newsletter.scheduleHour)}
                      </p>
                    </div>
                  </div>
                </div>

                {newsletter.scheduleDays.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Scheduled days
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {[
                        "monday",
                        "tuesday",
                        "wednesday",
                        "thursday",
                        "friday",
                        "saturday",
                        "sunday",
                      ].map((day) => (
                        <span
                          key={day}
                          className={cn(
                            "rounded-md px-2 py-1 text-xs font-medium",
                            newsletter.scheduleDays.includes(day)
                              ? "bg-accent/20 text-accent"
                              : "bg-secondary text-muted-foreground",
                          )}
                        >
                          {DAY_LABELS[day]}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm text-muted-foreground">
                    Next delivery
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {format(nextRun, "EEE, MMM d")}
                  </span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      <footer className="border-t border-border bg-card/50 mt-16 mb-16 sm:mb-0">
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
