import { auth } from "@clerk/nextjs/server";
import { Inbox, CalendarDays, Newspaper } from "lucide-react";
import { redirect } from "next/navigation";
import { FeedFilters } from "@/components/feed-filters";
import { FeedList } from "@/components/feed-list";
import { NewsletterHeader } from "@/components/newsletter-header";
import { SubscriptionPanel } from "@/components/subscription-panel";
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
  const frequency =
    typeof sp.frequency === "string" ? sp.frequency : undefined;
  const dateRange =
    typeof sp.dateRange === "string" ? sp.dateRange : undefined;
  const limit = typeof sp.limit === "string" ? Number(sp.limit) : PAGE_SIZE;

  const plan = await getUserPlan(userId);
  const admin = isAdmin(plan);

  const [sends, newsletters, stats] = await Promise.all([
    getFeedSends(userId, admin, { newsletter, frequency, dateRange, limit }),
    getFeedNewsletters(userId, admin),
    getFeedStats(userId, admin),
  ]);

  if (stats.subscriptions.length === 0 && sends.length === 0) {
    redirect("/newsletters");
  }

  const hasMore = sends.length > limit;
  const visible = hasMore ? sends.slice(0, limit) : sends;
  const hasFilters = !!(newsletter || frequency || dateRange);

  const serialized = visible.map((s) => ({
    id: s.id,
    sentAt: s.sentAt?.toISOString() ?? null,
    run: {
      id: s.run.id,
      content: s.run.content as {
        editionTitle?: string;
        title?: string;
        summary?: string;
        keyTakeaways?: string[];
        sections?: { heading: string }[];
      } | null,
      newsletter: s.run.newsletter,
    },
  }));

  return (
    <div className="min-h-screen bg-background">
      <NewsletterHeader />

      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-6 pb-24 sm:pb-12 md:py-8">
        {/* ── Page header ─────────────────────────────────── */}
        <div className="flex items-baseline justify-between mb-6">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            My Digests
          </h1>
          <div className="flex items-center gap-4 text-xs text-muted-foreground/60">
            <span className="flex items-center gap-1.5">
              <Inbox className="h-3.5 w-3.5" />
              {stats.totalDigests}
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              {stats.digestsThisWeek} this week
            </span>
            <span className="flex items-center gap-1.5">
              <Newspaper className="h-3.5 w-3.5" />
              {stats.subscriptions.length}
            </span>
          </div>
        </div>

        {/* ── Subscriptions ───────────────────────────────── */}
        {stats.subscriptions.length > 0 && (
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
        )}

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
      </main>
    </div>
  );
}
