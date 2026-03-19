import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/prisma";

export const weeklyOrchestrator = inngest.createFunction(
  { id: "weekly-orchestrator", triggers: [{ cron: "0 8 * * 1" }] },
  async ({ step, logger }) => {
    logger.info("Weekly orchestrator started");

    const newsletters = await step.run("find-weekly-newsletters", async () => {
      const results = await prisma.newsletter.findMany({
        where: { frequency: "weekly", subscriptions: { some: { pausedAt: null } } },
        select: { id: true, title: true },
      });
      logger.info(`Found ${results.length} weekly newsletters with active subscribers`);
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
