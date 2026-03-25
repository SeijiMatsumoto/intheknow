import { clerkClient } from "@clerk/nextjs/server";
import { startOfDay, startOfWeek } from "date-fns";
import { inngest } from "@/inngest/client";
import { renderEmail } from "@/inngest/lib/render-email";
import { getDigestConfig } from "@/lib/digest-config";
import type { Frequency } from "@/lib/frequency";
import { digestCostBreakdown, formatCostLog } from "@/lib/token-pricing";
import { runNewsletterAgent } from "./newsletter-agent";
import {
  createDigestRun,
  failDigestRun,
  findRecentDigestRun,
  getNewsletterById,
  getNewsletterSubscriptions,
  getPriorDigestTitles,
  getUserPlans,
  markDigestRunSent,
  saveDigestContent,
} from "./queries";

function getReuseSince(frequency: Frequency): Date {
  const now = new Date();
  if (frequency === "daily") {
    return startOfDay(now);
  }
  return startOfWeek(now, { weekStartsOn: 1 });
}

async function resolveRecipientEmails(
  subscriptions: { userId: string }[],
): Promise<{ userId: string; userEmail: string }[]> {
  const clerk = await clerkClient();
  const userList = await clerk.users.getUserList({
    userId: subscriptions.map((s) => s.userId),
    limit: subscriptions.length,
  });
  const emailMap = new Map(
    userList.data.map((u) => [u.id, u.emailAddresses[0]?.emailAddress]),
  );
  return subscriptions
    .map((sub) => {
      const email = emailMap.get(sub.userId);
      return email ? { userId: sub.userId, userEmail: email } : null;
    })
    .filter((e): e is { userId: string; userEmail: string } => e !== null);
}

export const newsletterWorker = inngest.createFunction(
  {
    id: "newsletter-worker",
    retries: 2,
    triggers: [{ event: "newsletter/run" }],
    onFailure: async ({ event, logger }) => {
      const { digestRunId } = event.data.event.data;
      const errorMessage =
        event.data.error?.message ?? "Function failed or timed out";
      if (digestRunId) {
        logger.error(
          `newsletter-worker failed — marking digest run ${digestRunId} as failed: ${errorMessage}`,
        );
        await failDigestRun(digestRunId, errorMessage);
      } else {
        logger.error(
          `newsletter-worker failed before digest run was created: ${errorMessage}`,
        );
      }
    },
  },
  async ({ event, step, logger }) => {
    const { newsletterId, digestRunId, userEmails, userIds, tier = "pro" } = event.data;
    const digestConfig = getDigestConfig(tier);
    logger.info("newsletter-worker started", {
      newsletterId,
      tier,
      generationGates: {
        model: digestConfig.model,
        maxSteps: digestConfig.maxSteps,
        storyTarget: digestConfig.storyTarget,
        socialConsensus: digestConfig.socialConsensus,
        deepResearch: digestConfig.deepResearch,
      },
      userEmails,
      userIds,
    });

    // 1. Load newsletter + subscriptions + check for reusable run
    const { newsletter, subscriptions, recentRun } = await step.run(
      "load-newsletter",
      async () => {
        const newsletter = await getNewsletterById(newsletterId);
        logger.info(
          `Loaded newsletter: "${newsletter.title}" (${newsletter.frequency})`,
        );

        const subscriptions = userEmails
          ? []
          : await getNewsletterSubscriptions(newsletterId, userIds);

        if (userEmails) {
          logger.info(`Email override — sending to: ${userEmails.join(", ")}`);
        } else {
          logger.info(`Found ${subscriptions.length} subscriber(s)`);
        }

        // Check for reusable run (system newsletters only)
        let recentRun = null;
        if (!newsletter.createdBy && !userEmails) {
          recentRun = await findRecentDigestRun(
            newsletterId,
            getReuseSince(newsletter.frequency as Frequency),
          );
          if (recentRun) {
            logger.info(
              `Found reusable run ${recentRun.id} (${recentRun.runAt.toISOString()})`,
            );
          }
        }

        return { newsletter, subscriptions, recentRun };
      },
    );

    const recipientEmails = userEmails ?? [];

    if (!userEmails && subscriptions.length === 0) {
      logger.info("No subscribers for this run, skipping");
      return { newsletterId, skipped: true, reason: "no subscribers" };
    }

    // 2a. Reuse recent run — skip generation, fan out emails directly
    if (recentRun?.emailHtml) {
      logger.info(`Reusing digest run ${recentRun.id} — skipping generation`);

      await step.run("fan-out-emails-reuse", async () => {
        const emails = await resolveRecipientEmails(subscriptions);
        if (emails.length === 0) {
          logger.warn("No valid recipients for reuse — skipping");
          return;
        }
        const content = recentRun.content as { editionTitle?: string } | null;
        await inngest.send(
          emails.map((e) => ({
            name: "newsletter/email.generated" as const,
            data: {
              digestRunId: recentRun.id,
              newsletterId,
              newsletterTitle: content?.editionTitle ?? newsletter.title,
              userId: e.userId,
              userEmail: e.userEmail,
              emailHtml: recentRun.emailHtml,
            },
          })),
        );
        logger.info(`Fired ${emails.length} email(s) using cached run`);
      });

      return {
        digestRunId: recentRun.id,
        reused: true,
        recipientCount: subscriptions.length,
      };
    }

    // 2. Create digest run
    const digestRun = await step.run("create-digest-run", async () => {
      const run = await createDigestRun(newsletterId, digestRunId);
      logger.info(`Created digest run: ${run.id}`);
      return run;
    });

    // Extract domain hints from sources
    const sources = (newsletter.sources ?? {}) as {
      rss?: string[];
      sites?: string[];
    };
    const domainHints = [...(sources.rss ?? []), ...(sources.sites ?? [])]
      .map((u) => {
        try {
          return new URL(u).hostname.replace(/^www\./, "");
        } catch {
          return u;
        }
      })
      .filter(Boolean)
      .slice(0, 6);

    // 2b. Fetch prior digest titles for dedup
    const priorTitles = await step.run("fetch-prior-titles", async () => {
      const titles = await getPriorDigestTitles(newsletterId);
      if (titles.length > 0) {
        logger.info(
          `Found ${titles.length} prior story title(s) for dedup`,
        );
      }
      return titles;
    });

    // 3. Run agent — research + write newsletter
    const { digest, model, stepCount, usage, toolCallCounts } = await step.run(
      "run-agent",
      async () => {
        logger.info("Starting newsletter agent");
        const result = await runNewsletterAgent({
          title: newsletter.title,
          description: newsletter.description,
          frequency: newsletter.frequency as Frequency,
          keywords: newsletter.keywords,
          domainHints,
          tier,
          priorTitles,
        });
        const cost = digestCostBreakdown(
          result.model,
          result.usage.inputTokens,
          result.usage.outputTokens,
          result.toolCallCounts,
        );
        logger.info(
          `Agent complete — "${result.digest.editionTitle}", ${result.digest.sections.length} section(s), ${result.digest.keyTakeaways.length} takeaway(s) | steps: ${result.stepCount} | ${formatCostLog(cost)}`,
        );
        return result;
      },
    );

    if (!digest) {
      logger.warn("Agent returned no digest — marking run as failed");
      await failDigestRun(digestRun.id, "Agent returned no digest");
      return {
        digestRunId: digestRun.id,
        skipped: true,
        reason: "agent failed",
      };
    }

    // 4. Render emails (full + teaser for free users)
    const { fullHtml, teaserHtml } = await step.run("render-email", async () => {
      const freq = newsletter.frequency as Frequency;
      const full = renderEmail(digest, newsletter.title, freq);
      const teaser = renderEmail(digest, newsletter.title, freq, { teaser: true });
      logger.info(
        `Email rendered — full: ${full.length} chars, teaser: ${teaser.length} chars`,
      );
      return { fullHtml: full, teaserHtml: teaser };
    });

    // 5. Persist content (save full version)
    await step.run("save-digest-content", async () => {
      await saveDigestContent(digestRun.id, digest, fullHtml);
      logger.info("Digest content saved");
    });

    // 6. Fan out emails (free users get teaser, paid users get full)
    await step.run("fan-out-emails", async () => {
      let emails: { userId: string; userEmail: string }[];

      if (recipientEmails.length > 0) {
        emails = recipientEmails.map((email: string) => ({
          userId: "manual",
          userEmail: email,
        }));
        logger.info(
          `Email override — recipients: ${emails.map((e) => e.userEmail).join(", ")}`,
        );
      } else {
        emails = await resolveRecipientEmails(subscriptions);
        logger.info(`Resolved ${emails.length} recipient(s) from Clerk`);
      }

      if (emails.length === 0) {
        logger.warn("No valid recipients — skipping email send");
        return;
      }

      // Look up plans to decide full vs teaser email
      const plans = await getUserPlans(
        emails.map((e) => e.userId).filter((id) => id !== "manual"),
      );

      await inngest.send(
        emails.map((e) => {
          const plan = e.userId === "manual" ? "admin" : (plans.get(e.userId) ?? "free");
          return {
            name: "newsletter/email.generated" as const,
            data: {
              digestRunId: digestRun.id,
              newsletterId,
              newsletterTitle: digest.editionTitle,
              userId: e.userId,
              userEmail: e.userEmail,
              emailHtml: plan === "free" ? teaserHtml : fullHtml,
            },
          };
        }),
      );

      const freeCount = emails.filter(
        (e) => e.userId !== "manual" && (plans.get(e.userId) ?? "free") === "free",
      ).length;
      logger.info(
        `Fired ${emails.length} email(s) — ${emails.length - freeCount} full, ${freeCount} teaser`,
      );
    });

    // 7. Mark as sent
    await step.run("mark-sent", async () => {
      await markDigestRunSent(digestRun.id);
      logger.info("Digest run marked as sent");
    });

    const recipientCount = recipientEmails.length || subscriptions.length;
    const cost = digestCostBreakdown(
      model,
      usage.inputTokens,
      usage.outputTokens,
      toolCallCounts,
    );
    logger.info(
      `newsletter-worker complete — digestRunId: ${digestRun.id}, recipients: ${recipientCount}, ${formatCostLog(cost)}`,
    );
    return {
      digestRunId: digestRun.id,
      tier,
      recipientCount,
      stepCount,
      usage,
      toolCallCounts,
      cost,
      agentSummary: digest.agentSummary,
    };
  },
);
