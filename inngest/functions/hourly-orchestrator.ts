import { inngest } from "@/inngest/client";
import { getActiveSubscriptionsWithSchedule } from "./queries";

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export const hourlyOrchestrator = inngest.createFunction(
  { id: "hourly-orchestrator", triggers: [{ cron: "0 * * * *" }] },
  async ({ step, logger }) => {
    const now = new Date();
    const currentHour = now.getUTCHours();
    const currentDay = DAYS[now.getUTCDay()];

    logger.info(`Hourly orchestrator — ${currentDay} ${currentHour}:00 UTC`);

    const subscriptions = await step.run("load-subscriptions", () =>
      getActiveSubscriptionsWithSchedule(),
    );

    const due = subscriptions.filter((sub) => {
      const days = sub.scheduleDays.length > 0 ? sub.scheduleDays : sub.newsletter.scheduleDays;
      const hour = sub.scheduleHour ?? sub.newsletter.scheduleHour;
      return days.includes(currentDay) && hour === currentHour;
    });

    logger.info(`${due.length} subscription(s) due this hour`);
    if (due.length === 0) return { fired: 0 };

    // Group by newsletterId
    const byNewsletter = new Map<string, { title: string; userIds: string[] }>();
    for (const sub of due) {
      const entry = byNewsletter.get(sub.newsletterId) ?? {
        title: sub.newsletter.title,
        userIds: [],
      };
      entry.userIds.push(sub.userId);
      byNewsletter.set(sub.newsletterId, entry);
    }

    for (const [, { title, userIds }] of byNewsletter) {
      logger.info(`  → ${title}: ${userIds.length} recipient(s)`);
    }

    await step.sendEvent(
      "fan-out-newsletter-workers",
      [...byNewsletter.entries()].map(([newsletterId, { userIds }]) => ({
        name: "newsletter/run" as const,
        data: { newsletterId, userIds },
      })),
    );

    logger.info(`Fired ${byNewsletter.size} newsletter/run event(s)`);
    return { fired: byNewsletter.size };
  },
);
