import { auth } from "@clerk/nextjs/server";
import { formatDistanceToNow } from "date-fns";
import { Inbox, CalendarDays, Newspaper } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FeedFilters } from "@/components/feed-filters";
import { FeedList } from "@/components/feed-list";
import { NewsletterHeader } from "@/components/newsletter-header";
import { getCategory } from "@/lib/categories";
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

      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-6 pb-24 sm:pb-12 md:py-8">
        {/* ── Page header ─────────────────────────────────── */}
        <div className="flex items-baseline justify-between mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
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

        {/* ── Subscriptions pills ─────────────────────────── */}
        {stats.subscriptions.length > 0 && (
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
            {stats.subscriptions.map((sub) => {
              const cat = getCategory(sub.categoryId);
              const CatIcon = cat.icon;
              return (
                <Link
                  key={sub.newsletterSlug}
                  href={`/newsletters/${sub.newsletterSlug}`}
                  className="flex items-center gap-1.5 shrink-0 rounded-full border border-border/60 px-3 py-1.5 text-xs text-muted-foreground hover:border-foreground/30 hover:text-foreground transition-colors"
                >
                  <CatIcon className="h-3 w-3" />
                  {sub.newsletterTitle}
                  {sub.lastSentAt && (
                    <span className="text-[10px] text-muted-foreground/40">
                      {formatDistanceToNow(new Date(sub.lastSentAt), { addSuffix: true })}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
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
