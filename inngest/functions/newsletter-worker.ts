import { clerkClient } from "@clerk/nextjs/server";
import { inngest } from "@/inngest/client";
import { renderEmail } from "@/inngest/lib/render-email";
import { type NewsletterInput, runNewsletterAgent } from "./newsletter-agent";
import {
  createDigestRun,
  failDigestRun,
  findRecentDigestRun,
  getNewsletterById,
  getNewsletterSubscriptions,
  markDigestRunSent,
  saveDigestContent,
} from "./queries";

function getReuseSince(frequency: string): Date {
  const now = new Date();
  if (frequency === "daily") {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }
  const diff = (now.getUTCDay() + 6) % 7;
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diff));
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
  },
  async ({ event, step, logger }) => {
    const { newsletterId, userEmails, userIds } = event.data;
    logger.info("newsletter-worker started", { newsletterId, userEmails, userIds });

    // 1. Load newsletter + subscriptions + check for reusable run
    const { newsletter, subscriptions, recentRun } = await step.run(
      "load-newsletter",
      async () => {
        const newsletter = await getNewsletterById(newsletterId);
        logger.info(`Loaded newsletter: "${newsletter.title}" (${newsletter.frequency})`);

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
          recentRun = await findRecentDigestRun(newsletterId, getReuseSince(newsletter.frequency));
          if (recentRun) {
            logger.info(`Found reusable run ${recentRun.id} (${recentRun.runAt.toISOString()})`);
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
              newsletterTitle: content?.editionTitle ?? newsletter.title,
              userId: e.userId,
              userEmail: e.userEmail,
              emailHtml: recentRun.emailHtml,
            },
          })),
        );
        logger.info(`Fired ${emails.length} email(s) using cached run`);
      });

      return { digestRunId: recentRun.id, reused: true, recipientCount: subscriptions.length };
    }

    // 2. Create digest run
    const digestRun = await step.run("create-digest-run", async () => {
      const run = await createDigestRun(newsletterId);
      logger.info(`Created digest run: ${run.id}`);
      return run;
    });

    const sources = newsletter.sources as NewsletterInput["sources"];

    // 3. Run agent — research + write newsletter
    const { digest, stepCount, usage, toolCallCounts } = await step.run(
      "run-agent",
      async () => {
        logger.info("Starting newsletter agent");
        const result = await runNewsletterAgent({
          title: newsletter.title,
          description: newsletter.description,
          frequency: newsletter.frequency,
          keywords: newsletter.keywords,
          sources,
        });
        logger.info(
          `Agent complete — "${result.digest.editionTitle}", ${result.digest.sections.length} section(s), ${result.digest.keyTakeaways.length} takeaway(s) | steps: ${result.stepCount}, tokens in/out: ${result.usage.inputTokens}/${result.usage.outputTokens}, tools: ${JSON.stringify(result.toolCallCounts)}`,
        );
        return result;
      },
    );

    if (!digest) {
      logger.warn("Agent returned no digest — marking run as failed");
      await failDigestRun(digestRun.id, "Agent returned no digest");
      return { digestRunId: digestRun.id, skipped: true, reason: "agent failed" };
    }

    // 4. Render email
    const emailHtml = await step.run("render-email", async () => {
      const html = renderEmail(digest, newsletter.title, newsletter.frequency);
      logger.info(`Email rendered (${html.length} chars)`);
      return html;
    });

    // 5. Persist content
    await step.run("save-digest-content", async () => {
      await saveDigestContent(digestRun.id, digest, emailHtml);
      logger.info("Digest content saved");
    });

    // 6. Fan out emails
    await step.run("fan-out-emails", async () => {
      let emails: { userId: string; userEmail: string }[];

      if (recipientEmails.length > 0) {
        emails = recipientEmails.map((email: string) => ({ userId: "manual", userEmail: email }));
        logger.info(`Email override — recipients: ${emails.map((e) => e.userEmail).join(", ")}`);
      } else {
        emails = await resolveRecipientEmails(subscriptions);
        logger.info(`Resolved ${emails.length} recipient(s) from Clerk`);
      }

      if (emails.length === 0) {
        logger.warn("No valid recipients — skipping email send");
        return;
      }

      await inngest.send(
        emails.map((e) => ({
          name: "newsletter/email.generated" as const,
          data: {
            digestRunId: digestRun.id,
            newsletterTitle: digest.editionTitle,
            userId: e.userId,
            userEmail: e.userEmail,
            emailHtml,
          },
        })),
      );
      logger.info(`Fired ${emails.length} newsletter/email.generated event(s)`);
    });

    // 7. Mark as sent
    await step.run("mark-sent", async () => {
      await markDigestRunSent(digestRun.id);
      logger.info("Digest run marked as sent");
    });

    const recipientCount = recipientEmails.length || subscriptions.length;
    logger.info(`newsletter-worker complete — digestRunId: ${digestRun.id}, recipients: ${recipientCount}`);
    return {
      digestRunId: digestRun.id,
      recipientCount,
      stepCount,
      usage,
      toolCallCounts,
      agentSummary: digest.agentSummary,
    };
  },
);
