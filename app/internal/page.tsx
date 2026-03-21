import { NewslettersTable } from "@/components/internal/newsletters-table";
import { NewsletterHeader } from "@/components/newsletter-header";
import type { Frequency } from "@/lib/frequency";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 50;

export default async function InternalPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const [newsletters, total, recentRuns, totalSubscriptions, categories] =
    await Promise.all([
      prisma.newsletter.findMany({
        orderBy: { title: "asc" },
        skip,
        take: PAGE_SIZE,
        include: {
          _count: { select: { subscriptions: true, digestRuns: true } },
          category: { select: { label: true } },
        },
      }),
      prisma.newsletter.count(),
      prisma.digestRun.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { newsletter: { select: { title: true } } },
      }),
      prisma.subscription.count({ where: { pausedAt: null } }),
      prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-background">
      <NewsletterHeader />
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Internal</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {totalSubscriptions} active subscriptions across {total} newsletters
          </p>
        </div>

        <NewslettersTable
          newsletters={newsletters.map((n) => ({
            ...n,
            frequency: n.frequency as Frequency,
          }))}
          recentRuns={recentRuns}
          categories={categories}
          page={page}
          totalPages={totalPages}
          total={total}
        />
      </div>
    </div>
  );
}
