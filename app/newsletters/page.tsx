import { SubscribeButton } from "@/app/newsletters/_components/subscribe-button";
import { prisma } from "@/lib/prisma";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

export default async function NewslettersPage() {
  const { userId } = await auth();

  const [newsletters, subscriptions] = await Promise.all([
    prisma.newsletter.findMany({
      where: { isSystem: true },
      orderBy: { title: "asc" },
    }),
    userId
      ? prisma.subscription.findMany({
          where: { userId },
          select: { id: true, newsletterId: true },
        })
      : [],
  ]);

  const subMap = new Map(subscriptions.map((s) => [s.newsletterId, s.id]));

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Newsletters</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Subscribe to topics you want to stay current on.
          </p>
        </div>
        <UserButton />
      </div>

      <ul className="divide-y divide-zinc-100">
        {newsletters.map((n) => (
          <li key={n.id} className="flex items-start justify-between gap-4 py-4">
            <div className="flex flex-col gap-1">
              <span className="font-medium">{n.title}</span>
              <span className="text-sm text-zinc-500">{n.description}</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {(n.keywords as string[]).slice(0, 4).map((kw) => (
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
                subscriptionId={subMap.get(n.id) ?? null}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
