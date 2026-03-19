import { TriggerButton } from "@/app/internal/_components/trigger-button";
import { prisma } from "@/lib/prisma";

export default async function InternalPage() {
  const [newsletters, recentRuns, totalSubscriptions] = await Promise.all([
    prisma.newsletter.findMany({
      orderBy: { title: "asc" },
      include: { _count: { select: { subscriptions: true, digestRuns: true } } },
    }),
    prisma.digestRun.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { newsletter: { select: { title: true } } },
    }),
    prisma.subscription.count({ where: { pausedAt: null } }),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Internal</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {totalSubscriptions} active subscriptions across {newsletters.length} newsletters
        </p>
      </div>

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Newsletters
        </h2>
        <div className="overflow-hidden rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Title</th>
                <th className="px-4 py-2 text-left font-medium">Frequency</th>
                <th className="px-4 py-2 text-left font-medium">System</th>
                <th className="px-4 py-2 text-right font-medium">Subscribers</th>
                <th className="px-4 py-2 text-right font-medium">Runs</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {newsletters.map((n) => (
                <tr key={n.id} className="hover:bg-muted/20">
                  <td className="px-4 py-2 font-medium">{n.title}</td>
                  <td className="px-4 py-2 text-muted-foreground">{n.frequency}</td>
                  <td className="px-4 py-2 text-muted-foreground">{n.isSystem ? "yes" : "no"}</td>
                  <td className="px-4 py-2 text-right">{n._count.subscriptions}</td>
                  <td className="px-4 py-2 text-right">{n._count.digestRuns}</td>
                  <td className="px-4 py-2 text-right">
                    <TriggerButton newsletterId={n.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Recent Digest Runs
        </h2>
        <div className="overflow-hidden rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Newsletter</th>
                <th className="px-4 py-2 text-left font-medium">Status</th>
                <th className="px-4 py-2 text-left font-medium">Run At</th>
                <th className="px-4 py-2 text-left font-medium">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {recentRuns.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-4 text-center text-muted-foreground">
                    No runs yet
                  </td>
                </tr>
              )}
              {recentRuns.map((run) => (
                <tr key={run.id} className="hover:bg-muted/20">
                  <td className="px-4 py-2 font-medium">{run.newsletter.title}</td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        run.status === "sent"
                          ? "text-green-600"
                          : run.status === "failed"
                            ? "text-red-500"
                            : "text-yellow-600"
                      }
                    >
                      {run.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {new Date(run.runAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-red-500 text-xs">{run.error ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
