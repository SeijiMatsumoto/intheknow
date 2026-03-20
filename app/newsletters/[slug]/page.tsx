import { auth } from "@clerk/nextjs/server";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SubscribeButton } from "@/components/newsletters/subscribe-button";
import { SubscriptionRow } from "@/components/newsletters/subscription-row";
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

  if (!newsletter) notFound();

  const [subscription, canCustomize, digestRunCount] = await Promise.all([
    userId
      ? prisma.subscription.findFirst({
          where: { userId, newsletterId: newsletter.id },
        })
      : null,
    userId ? canUse(userId, "custom_schedule") : false,
    prisma.digestRun.count({
      where: { newsletterId: newsletter.id, status: "sent" },
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
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link
            href="/newsletters"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            All newsletters
          </Link>

          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 mr-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent">
                <Zap className="h-3.5 w-3.5 text-accent-foreground" />
              </div>
              <span className="text-sm font-semibold text-foreground">
                The Latest
              </span>
            </Link>
            <SubscribeButton
              newsletterId={newsletter.id}
              subscriptionId={subscription?.id ?? null}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        {/* Hero */}
        <div className="mb-12">
          <div className="flex items-start gap-6">
            {(() => {
              const cat = getCategory(newsletter.categoryId);
              const CatIcon = cat.icon;
              return (
                <div
                  className={cn(
                    "flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl",
                    cat.bg,
                  )}
                >
                  <CatIcon className={cn("h-10 w-10", cat.color)} />
                </div>
              );
            })()}

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                {(() => {
                  const cat = getCategory(newsletter.categoryId);
                  const CatIcon = cat.icon;
                  return (
                    <span
                      className={cn(
                        "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
                        cat.pill,
                      )}
                    >
                      <CatIcon className="h-3 w-3" />
                      {cat.label}
                    </span>
                  );
                })()}
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
                {subscription && (
                  <span className="flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
                    <CheckCircle2 className="h-3 w-3" />
                    Subscribed
                  </span>
                )}
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

          {/* Keywords */}
          {newsletter.keywords.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {newsletter.keywords.map((kw) => (
                <span
                  key={kw}
                  className="rounded-full bg-secondary px-3 py-1.5 text-sm text-muted-foreground"
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
          <div className="lg:col-span-2 space-y-8">
            {/* Topics covered as keywords */}
            <section className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Topics covered
              </h2>
              <div className="flex flex-wrap gap-2">
                {newsletter.keywords.map((kw) => (
                  <div
                    key={kw}
                    className="flex items-center gap-2 rounded-lg bg-secondary/50 px-4 py-2.5"
                  >
                    <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
                    <span className="text-sm text-foreground capitalize">
                      {kw}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Subscription schedule row (if subscribed) */}
            {subscription && (
              <section className="rounded-2xl border border-border bg-card p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  Your subscription
                </h2>
                <SubscriptionRow
                  subscriptionId={subscription.id}
                  frequency={newsletter.frequency}
                  newsletterDays={newsletter.scheduleDays}
                  newsletterHour={newsletter.scheduleHour}
                  currentDays={subscription.scheduleDays}
                  currentHour={subscription.scheduleHour}
                  nextRunIso={nextRun.toISOString()}
                  canCustomize={canCustomize}
                />
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
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
              </div>
            </section>

            {/* Stats */}
            <section className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Stats
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Issues sent
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {digestRunCount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Next delivery
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {nextRun.toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      <footer className="border-t border-border bg-card/50 mt-16">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <p className="text-center text-sm text-muted-foreground">
            Unsubscribe anytime. We respect your inbox.
          </p>
        </div>
      </footer>
    </div>
  );
}
