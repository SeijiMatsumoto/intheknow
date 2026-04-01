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
  findSkippedDigestRun,
  getNewsletterById,
  getNewsletterSubscriptions,
  getPriorDigestTitles,
  markDigestRunSent,
  saveDigestContent,
  skipDigestRun,
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

    // 1. Load newsletter + subscriptions + check for reusable run + extract domain hints
    const { newsletter, subscriptions, recentRun, skippedRun, domainHints } = await step.run(
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

        let recentRun = null;
        let skippedRun = null;
        if (!newsletter.createdBy && !userEmails) {
          const since = getReuseSince(newsletter.frequency as Frequency);
          [recentRun, skippedRun] = await Promise.all([
            findRecentDigestRun(newsletterId, since),
            findSkippedDigestRun(newsletterId),
          ]);
          if (recentRun) {
            logger.info(
              `Found reusable run ${recentRun.id} (${recentRun.runAt.toISOString()})`,
            );
          }
          if (skippedRun) {
            logger.info(
              `Found skipped run ${skippedRun.id} (${skippedRun.runAt.toISOString()}) — no stories in this period`,
            );
          }
        }

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

        return { newsletter, subscriptions, recentRun, skippedRun, domainHints };
      },
    );

    if (!userEmails && subscriptions.length === 0) {
      logger.info("No subscribers for this run, skipping");
      return { newsletterId, skipped: true, reason: "no subscribers" };
    }

    if (skippedRun) {
      logger.info(
        `Edition already skipped in this period (run ${skippedRun.id}) — not re-running agent`,
      );
      return {
        digestRunId: skippedRun.id,
        skipped: true,
        reason: "already skipped this period",
      };
    }

    // 2. Resolve recipient emails once (used by both reuse and fresh paths)
    const emails = await step.run("resolve-recipients", async () => {
      if (userEmails) {
        return userEmails.map((email: string) => ({
          userId: "manual",
          userEmail: email,
        }));
      }
      const resolved = await resolveRecipientEmails(subscriptions);
      logger.info(`Resolved ${resolved.length} recipient(s) from Clerk`);
      return resolved;
    });

    // 3. Reuse recent run — skip generation, fan out emails directly
    if (recentRun?.emailHtml) {
      logger.info(`Reusing digest run ${recentRun.id} — skipping generation`);

      await step.run("fan-out-emails-reuse", async () => {
        if (emails.length === 0) {
          logger.warn("No valid recipients for reuse — skipping");
          return;
        }
        const content = recentRun.content as { editionTitle?: string } | null;
        await inngest.send(
          emails.map((e: { userId: string; userEmail: string }) => ({
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
        recipientCount: emails.length,
      };
    }

    // 4. Create digest run + fetch prior titles (parallel)
    const [digestRun, priorTitles] = await Promise.all([
      step.run("create-digest-run", async () => {
        const run = await createDigestRun(newsletterId, digestRunId);
        logger.info(`Created digest run: ${run.id}`);
        return run;
      }),
      step.run("fetch-prior-titles", async () => {
        const titles = await getPriorDigestTitles(newsletterId);
        if (titles.length > 0) {
          logger.info(`Found ${titles.length} prior story title(s) for dedup`);
        }
        return titles;
      }),
    ]);

    // 5. Run agent — research + write newsletter
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
        logger.info(
          `Agent complete — "${result.digest.editionTitle}", ${result.digest.sections.length} section(s), ${result.digest.keyTakeaways.length} takeaway(s) | steps: ${result.stepCount}`,
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

    if (digest.skipEdition) {
      logger.info(
        `Agent flagged skipEdition — no usable stories found. Skipping email send.`,
      );
      await skipDigestRun(digestRun.id);
      return {
        digestRunId: digestRun.id,
        skipped: true,
        reason: "no stories found",
      };
    }

    // 6. Render email
    const emailHtml = await step.run("render-email", async () => {
      const html = await renderEmail(digest, newsletter.title);
      logger.info(`Email rendered — ${html.length} chars`);
      return html;
    });

    // 7. Save content + fan out emails & mark sent (parallel)
    await Promise.all([
      step.run("save-digest-content", async () => {
        await saveDigestContent(digestRun.id, digest, emailHtml);
        logger.info("Digest content saved");
      }),
      step.run("fan-out-and-mark-sent", async () => {
        if (emails.length > 0) {
          await inngest.send(
            emails.map((e: { userId: string; userEmail: string }) => ({
              name: "newsletter/email.generated" as const,
              data: {
                digestRunId: digestRun.id,
                newsletterId,
                newsletterTitle: digest.editionTitle,
                userId: e.userId,
                userEmail: e.userEmail,
                emailHtml,
              },
            })),
          );
          logger.info(`Fired ${emails.length} email(s)`);
        } else {
          logger.warn("No valid recipients — skipping email send");
        }

        await markDigestRunSent(digestRun.id);
        logger.info("Digest run marked as sent");
      }),
    ]);

    const cost = digestCostBreakdown(
      model,
      usage.inputTokens,
      usage.outputTokens,
      toolCallCounts,
    );
    logger.info(
      `newsletter-worker complete — digestRunId: ${digestRun.id}, recipients: ${emails.length}, ${formatCostLog(cost)}`,
    );
    return {
      digestRunId: digestRun.id,
      tier,
      recipientCount: emails.length,
      stepCount,
      usage,
      toolCallCounts,
      cost,
      agentSummary: digest.agentSummary,
    };
  },
);
