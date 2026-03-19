import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/prisma";

export const weeklyOrchestrator = inngest.createFunction(
  { id: "weekly-orchestrator", triggers: [{ cron: "0 8 * * 1" }] },
  async ({ step }) => {
    // Find all weekly newsletters that have at least one active subscriber
    const newsletters = await step.run("find-weekly-newsletters", async () => {
      return prisma.newsletter.findMany({
        where: {
          frequency: "weekly",
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
