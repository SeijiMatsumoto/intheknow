import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/prisma";

export const dailyOrchestrator = inngest.createFunction(
  { id: "daily-orchestrator", triggers: [{ cron: "0 8 * * *" }] },
  async ({ step, logger }) => {
    logger.info("Daily orchestrator started");

    const newsletters = await step.run("find-daily-newsletters", async () => {
      const results = await prisma.newsletter.findMany({
        where: { frequency: "daily", subscriptions: { some: { pausedAt: null } } },
        select: { id: true, title: true },
      });
      logger.info(`Found ${results.length} daily newsletters with active subscribers`);
      for (const n of results) logger.info(`  → ${n.title} (${n.id})`);
      return results;
    });

    if (newsletters.length === 0) {
      logger.info("No newsletters to process, exiting");
      return { fired: 0 };
    }

    await step.sendEvent(
      "fan-out-newsletter-workers",
      newsletters.map((n) => ({
        name: "newsletter/run" as const,
        data: { newsletterId: n.id },
      })),
    );

    logger.info(`Fired ${newsletters.length} newsletter/run events`);
    return { fired: newsletters.length };
  },
);
