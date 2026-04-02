import { auth } from "@clerk/nextjs/server";
import { NewsletterHeader } from "@/components/newsletters/newsletter-header";
import { NewslettersClient } from "@/components/newsletters/newsletters-client";
import { PageHeader } from "@/components/layout/page-header";
import type { Frequency } from "@/lib/date-utils";
import { canUse } from "@/lib/gates";
import { prisma } from "@/lib/prisma";
import { nextRunDate } from "@/lib/schedule";

export default async function NewslettersPage() {
  const { userId } = await auth();

  const [newsletters, subscriptions, canCreateNewsletter] = await Promise.all([
    prisma.newsletter.findMany({
      where: {
        OR: [{ createdBy: null }, ...(userId ? [{ createdBy: userId }] : [])],
      },
      orderBy: { title: "asc" },
    }),
    userId
      ? prisma.subscription.findMany({
          where: { userId },
          select: {
            id: true,
            newsletterId: true,
            scheduleDays: true,
            scheduleHour: true,
          },
        })
      : [],
    userId ? canUse(userId, "custom_newsletter") : false,
  ]);

  const subMap = new Map(subscriptions.map((s) => [s.newsletterId, s]));

  const items = newsletters.map((n) => {
    const sub = subMap.get(n.id) ?? null;
    const nextRun = nextRunDate(
      n.scheduleDays,
      n.scheduleHour,
      sub?.scheduleDays ?? [],
      sub?.scheduleHour ?? null,
    );

    return {
      newsletter: {
        id: n.id,
        title: n.title,
        slug: n.slug,
        description: n.description,
        frequency: n.frequency as Frequency,
        keywords: n.keywords,
        category: n.categoryId,
        isCustom: n.createdBy !== null,
      },
      subscriptionId: sub?.id ?? null,
      nextRunIso: nextRun.toISOString(),
    };
  });

  const subscribedCount = subscriptions.length;

  return (
    <div className="min-h-screen bg-background">
      <NewsletterHeader />

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6 pb-0 md:py-6">
        {/* Hero */}
        <PageHeader
          title="Explore"
          description="Newsletters across everything that matters — AI, finance, politics, sports, and more."
        />

        <NewslettersClient
          items={items}
          subscribedCount={subscribedCount}
          canCreateNewsletter={canCreateNewsletter}
        />
      </main>

      <footer className="border-t border-border bg-card/50 mt-16 mb-16 sm:mb-0">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <p className="text-center text-sm text-muted-foreground">
            Unsubscribe anytime. We respect your inbox.
          </p>
        </div>
      </footer>
    </div>
  );
}
