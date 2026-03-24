import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { FeedFilters } from "@/components/feed-filters";
import { FeedList } from "@/components/feed-list";
import { FeedSidebar } from "@/components/feed-sidebar";
import { NewsletterHeader } from "@/components/newsletter-header";
import { PageHeader } from "@/components/page-header";
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

      <main className="mx-auto max-w-5xl px-4 py-6 pb-24 sm:px-6 sm:py-12 sm:pb-12">
        <PageHeader
          title="My Feed"
          description="Your digest history across all subscriptions."
        />

        <FeedFilters
          newsletters={newsletters}
          filters={{ newsletter, frequency, dateRange }}
        />

        <div className="lg:grid lg:grid-cols-[1fr_280px] lg:gap-6">
          <FeedList
            sends={serialized}
            hasFilters={hasFilters}
            hasMore={hasMore}
            currentLimit={limit}
          />

          <aside className="hidden pt-7 lg:block">
            <div className="sticky top-20">
              <FeedSidebar stats={stats} />
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
