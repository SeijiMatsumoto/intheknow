import { auth } from "@clerk/nextjs/server";
import { NewsletterHeader } from "@/components/newsletter-header";
import { SettingsClient } from "@/components/settings/settings-client";
import type { Frequency } from "@/lib/frequency";
import { prisma } from "@/lib/prisma";
import { getUserPlan } from "@/lib/user";

export default async function SettingsPage() {
  const { userId } = await auth();

  const [subscriptions, plan] = await Promise.all([
    userId
      ? prisma.subscription.findMany({
          where: { userId, pausedAt: null },
          include: {
            newsletter: {
              select: {
                id: true,
                title: true,
                slug: true,
                categoryId: true,
                frequency: true,
                scheduleDays: true,
                scheduleHour: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        })
      : [],
    userId ? getUserPlan(userId) : ("free" as const),
  ]);

  const subscriptionData = subscriptions.map((s) => ({
    id: s.id,
    newsletterId: s.newsletterId,
    newsletterTitle: s.newsletter.title,
    newsletterSlug: s.newsletter.slug,
    newsletterCategoryId: s.newsletter.categoryId,
    frequency: s.newsletter.frequency as Frequency,
    scheduleDays:
      s.scheduleDays.length > 0 ? s.scheduleDays : s.newsletter.scheduleDays,
    scheduleHour: s.scheduleHour ?? s.newsletter.scheduleHour,
    createdAt: s.createdAt.toISOString(),
  }));

  return (
    <div className="min-h-screen bg-background">
      <NewsletterHeader hideProfile />
      <SettingsClient subscriptions={subscriptionData} plan={plan} />
    </div>
  );
}
