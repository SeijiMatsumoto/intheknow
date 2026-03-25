import { auth } from "@clerk/nextjs/server";
import { format, formatDistanceToNow } from "date-fns";
import { CalendarDays, Inbox, Newspaper } from "lucide-react";
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

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6 pb-24 sm:pb-12 md:py-6">
        {/* ── Nameplate ─────────────────────────────────────── */}
        <div className="text-center mb-1">
          <div className="border-t-2 border-foreground mb-3" />
          <p className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            My Digests
          </p>
          <div className="border-t border-foreground/20 mt-3 mb-2" />
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
          <div className="border-t border-foreground/20 mt-2 mb-6" />
        </div>

        {/* ── Stats strip ─────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-px border border-foreground/15 bg-foreground/15 mb-6">
          <div className="flex flex-col items-center py-4 bg-background">
            <Inbox className="h-4 w-4 text-muted-foreground/50 mb-1.5" />
            <p className="text-xl sm:text-2xl font-bold text-foreground leading-none">
              {stats.totalDigests}
            </p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/50">
              Total digests
            </p>
          </div>
          <div className="flex flex-col items-center py-4 bg-background">
            <CalendarDays className="h-4 w-4 text-muted-foreground/50 mb-1.5" />
            <p className="text-xl sm:text-2xl font-bold text-foreground leading-none">
              {stats.digestsThisWeek}
            </p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/50">
              This week
            </p>
          </div>
          <div className="flex flex-col items-center py-4 bg-background">
            <Newspaper className="h-4 w-4 text-muted-foreground/50 mb-1.5" />
            <p className="text-xl sm:text-2xl font-bold text-foreground leading-none">
              {stats.subscriptions.length}
            </p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/50">
              Subscriptions
            </p>
          </div>
        </div>

        {/* ── Subscriptions ticker ────────────────────────── */}
        {stats.subscriptions.length > 0 && (
          <div className="border-y border-foreground/15 py-3 mb-6 flex items-center gap-3 overflow-x-auto">
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/40 shrink-0">
              Active
            </span>
            {stats.subscriptions.map((sub) => {
              const cat = getCategory(sub.categoryId);
              const CatIcon = cat.icon;
              return (
                <Link
                  key={sub.newsletterSlug}
                  href={`/newsletters/${sub.newsletterSlug}`}
                  className="flex items-center gap-1.5 shrink-0 group"
                >
                  <CatIcon className="h-3 w-3 text-muted-foreground/40" />
                  <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                    {sub.newsletterTitle}
                  </span>
                  {sub.lastSentAt && (
                    <span className="text-[10px] text-muted-foreground/30">
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
