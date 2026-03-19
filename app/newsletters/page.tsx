import { SubscribeButton } from "@/app/newsletters/_components/subscribe-button";
import { SubscriptionRow } from "@/app/newsletters/_components/subscription-row";
import { canUse } from "@/lib/gates";
import { prisma } from "@/lib/prisma";
import { nextRunDate } from "@/lib/schedule";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

export default async function NewslettersPage() {
  const { userId } = await auth();

  const [newsletters, subscriptions, canCustomize] = await Promise.all([
    prisma.newsletter.findMany({
      where: { isSystem: true },
      orderBy: { title: "asc" },
    }),
    userId
      ? prisma.subscription.findMany({
          where: { userId },
          select: { id: true, newsletterId: true, scheduleDays: true, scheduleHour: true },
        })
      : [],
    userId ? canUse(userId, "custom_schedule") : false,
  ]);

  const subMap = new Map(subscriptions.map((s) => [s.newsletterId, s]));

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Newsletters</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Subscribe to topics you want to stay current on.
          </p>
        </div>
        <UserButton userProfileUrl="/settings" userProfileMode="navigation" />
      </div>

      <ul className="divide-y divide-zinc-100">
        {newsletters.map((n) => {
          const sub = subMap.get(n.id) ?? null;

          return (
            <li key={n.id} className="py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{n.title}</span>
                  <span className="text-sm text-zinc-500">{n.description}</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {n.keywords.slice(0, 4).map((kw) => (
                      <span
                        key={kw}
                        className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="shrink-0 pt-0.5">
                  <SubscribeButton
                    newsletterId={n.id}
                    subscriptionId={sub?.id ?? null}
                  />
                </div>
              </div>

              {sub && (
                <SubscriptionRow
                  subscriptionId={sub.id}
                  frequency={n.frequency}
                  newsletterDays={n.scheduleDays}
                  newsletterHour={n.scheduleHour}
                  currentDays={sub.scheduleDays}
                  currentHour={sub.scheduleHour}
                  nextRunIso={nextRunDate(n.scheduleDays, n.scheduleHour, sub.scheduleDays, sub.scheduleHour).toISOString()}
                  canCustomize={canCustomize}
                />
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
