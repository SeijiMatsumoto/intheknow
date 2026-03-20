import { auth } from "@clerk/nextjs/server";
import { NewsletterHeader } from "@/components/newsletter-header";
import { NewslettersClient } from "@/components/newsletters/newsletters-client";
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
        frequency: n.frequency,
        keywords: n.keywords,
        category: n.categoryId,
      },
      subscriptionId: sub?.id ?? null,
      nextRunIso: nextRun.toISOString(),
    };
  });

  const subscribedCount = subscriptions.length;

  return (
    <div className="min-h-screen bg-background">
      <NewsletterHeader />

      <main className="mx-auto max-w-5xl px-6 py-12">
        {/* Hero */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl text-balance">
            Stay in the know
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl text-pretty">
            Newsletters across everything that matters — AI, finance, politics,
            sports, and more. Subscribe to the topics you care about.
          </p>
        </div>

        <NewslettersClient
          items={items}
          subscribedCount={subscribedCount}
          canCreateNewsletter={canCreateNewsletter}
        />
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
