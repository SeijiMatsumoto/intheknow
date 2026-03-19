import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/prisma";

export const dailyOrchestrator = inngest.createFunction(
  { id: "daily-orchestrator", triggers: [{ cron: "0 8 * * *" }] },
  async ({ step }) => {
    // Find all daily newsletters that have at least one active subscriber
    const newsletters = await step.run("find-daily-newsletters", async () => {
      return prisma.newsletter.findMany({
        where: {
          frequency: "daily",
          subscriptions: {
            some: { pausedAt: null },
          },
        },
        select: { id: true, title: true },
      });
    });

    if (newsletters.length === 0) {
      return { fired: 0 };
    }

    // Fan out — one worker invocation per newsletter
    await step.sendEvent(
      "fan-out-newsletter-workers",
      newsletters.map((n) => ({
        name: "newsletter/run" as const,
        data: { newsletterId: n.id },
      })),
    );

    return { fired: newsletters.length };
  },
);
