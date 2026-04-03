import { auth } from "@clerk/nextjs/server";
import { Inbox, CalendarDays, Newspaper } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FeedFilters } from "@/components/feed/feed-filters";
import { FeedList } from "@/components/feed/feed-list";
import { NewsletterHeader } from "@/components/newsletters/newsletter-header";
import { SubscriptionPanel } from "@/components/common/subscription-panel";
import { getCategory } from "@/lib/categories";
import { nextRunDate } from "@/lib/schedule";
import { getUserPlan, isAdmin } from "@/lib/user";
import { getFeedNewsletters, getFeedSends, getFeedStats } from "./data";

const PAGE_SIZE = 20;

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function FeedPage({ searchParams }: Props) {
  const { userId } = await auth();
  if (!userId) redirect("/");

  const sp = await searchParams;
  const newsletter =
    typeof sp.newsletter === "string" ? sp.newsletter : undefined;
  const frequency = typeof sp.frequency === "string" ? sp.frequency : undefined;
  const dateRange = typeof sp.dateRange === "string" ? sp.dateRange : undefined;
  const limit = typeof sp.limit === "string" ? Number(sp.limit) : PAGE_SIZE;

  const plan = await getUserPlan(userId);
  const admin = isAdmin(plan);

  const [sends, newsletters, stats] = await Promise.all([
    getFeedSends(userId, admin, { newsletter, frequency, dateRange, limit }),
    getFeedNewsletters(userId, admin),
    getFeedStats(userId, admin),
  ]);

  const isEmpty = stats.subscriptions.length === 0 && sends.length === 0;

  if (isEmpty) {
    return (
      <div className="min-h-screen bg-background">
        <NewsletterHeader />
        <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6 md:py-8">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-6">
            My Digests
          </h1>
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Newspaper className="h-10 w-10 text-muted-foreground/30 mb-4" />
            <p className="text-lg font-medium text-foreground mb-1">
              No digests yet
            </p>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              Subscribe to newsletters to start receiving curated digests on the
              topics you care about.
            </p>
            <Link href="/newsletters">
              <Button size="lg">Browse newsletters</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const hasMore = sends.length > limit;
  const visible = hasMore ? sends.slice(0, limit) : sends;
  const hasFilters = !!(newsletter || frequency || dateRange);

  const serialized = visible.map((s) => ({
    id: s.id,
    sentAt: s.sentAt ? new Date(s.sentAt).toISOString() : null,
    run: {
      id: s.run.id,
      editionTitle: s.run.editionTitle,
      summary: s.run.summary,
      keyTakeaways: s.run.keyTakeaways,
      sectionCount: s.run.sections.length,
      storyCount: s.run.sections.reduce(
        (sum: number, sec: { _count: { stories: number } }) =>
          sum + sec._count.stories,
        0,
      ),
      newsletter: s.run.newsletter,
    },
  }));

  return (
    <div className="min-h-screen bg-background">
      <NewsletterHeader />

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6 pb-24 sm:pb-12 md:py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* ── Sidebar ──────────────────────────────────── */}
          <aside className="lg:w-64 lg:shrink-0 lg:sticky lg:top-20 lg:self-start">
            <h1 className="font-serif text-2xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
              My Digests
            </h1>

            <div className="flex flex-row lg:flex-col gap-3 mb-6">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Inbox className="h-3.5 w-3.5" />
                <span>
                  <span className="font-medium text-foreground">
                    {stats.totalDigests}
                  </span>{" "}
                  digests
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" />
                <span>
                  <span className="font-medium text-foreground">
                    {stats.digestsThisWeek}
                  </span>{" "}
                  this week
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Newspaper className="h-3.5 w-3.5" />
                <span>
                  <span className="font-medium text-foreground">
                    {stats.subscriptions.length}
                  </span>{" "}
                  subscriptions
                </span>
              </div>
            </div>

            {stats.subscriptions.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/40 mb-2">
                  Subscriptions
                </p>
                <SubscriptionPanel
                  subscriptions={stats.subscriptions.map((sub) => {
                    const cat = getCategory(sub.categoryId);
                    return {
                      newsletterTitle: sub.newsletterTitle,
                      newsletterSlug: sub.newsletterSlug,
                      frequency: sub.frequency,
                      scheduleDays: sub.scheduleDays,
                      scheduleHour: sub.scheduleHour,
                      categoryId: sub.categoryId,
                      categoryLabel: cat.label,
                      lastSentAt: sub.lastSentAt,
                      nextRunIso: nextRunDate(
                        sub.scheduleDays,
                        sub.scheduleHour,
                        [],
                        null,
                      ).toISOString(),
                    };
                  })}
                />
              </div>
            )}
          </aside>

          {/* ── Main content ─────────────────────────────── */}
          <div className="flex-1 min-w-0">
            <FeedFilters
              newsletters={newsletters}
              filters={{ newsletter, frequency, dateRange }}
            />

            <FeedList
              sends={serialized}
              hasFilters={hasFilters}
              hasMore={hasMore}
              currentLimit={limit}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
