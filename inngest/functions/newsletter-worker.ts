import { clerkClient } from "@clerk/nextjs/server";
import { inngest } from "@/inngest/client";
import { filterItems } from "@/inngest/lib/filter-items";
import { renderEmail } from "@/inngest/lib/render-email";
import { scoreItems } from "@/inngest/lib/score-items";
import { scrapeTwitter } from "@/inngest/lib/scrape-twitter";
import { scrapeWeb } from "@/inngest/lib/scrape-web";
import { synthesize } from "@/inngest/lib/synthesize";
import {
  createDigestRun,
  failDigestRun,
  findRecentDigestRun,
  getNewsletterById,
  getNewsletterSubscriptions,
  markDigestRunSent,
  saveDigestContent,
  saveDigestItems,
} from "./queries";

function getReuseSince(frequency: string): Date {
  const now = new Date();
  if (frequency === "daily") {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }
  // Start of ISO week (Monday)
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

    const sources = newsletter.sources as {
      rss: string[];
      twitter_queries: string[];
      sites: string[];
    };

    logger.info(
      `Scraping — RSS: ${sources.rss?.length ?? 0}, sites: ${sources.sites?.length ?? 0}, twitter: ${sources.twitter_queries?.length ?? 0}`,
    );

    // 3. Scrape sources in parallel
    const [webItems, twitterItems] = await Promise.all([
      step.run("scrape-web", async () => {
        const items = await scrapeWeb(
          { rss: sources.rss ?? [], sites: sources.sites ?? [] },
          newsletter.keywords,
          newsletter.frequency,
        );
        logger.info(`scrape-web returned ${items.length} items`);
        return items;
      }),
      step.run("scrape-twitter", async () => {
        const items = await scrapeTwitter(sources.twitter_queries ?? [], newsletter.keywords);
        logger.info(`scrape-twitter returned ${items.length} items`);
        return items;
      }),
    ]);

    const allCandidates = [...webItems, ...twitterItems];
    logger.info(`Total candidates: ${allCandidates.length}`);

    if (allCandidates.length === 0) {
      logger.warn("No candidates found — marking run as failed");
      await failDigestRun(digestRun.id, "No candidates found from any source");
      return { digestRunId: digestRun.id, skipped: true, reason: "no candidates" };
    }

    // 4. Score items
    const scoredItems = await step.run("score-items", async () => {
      const items = await scoreItems(
        allCandidates,
        newsletter.keywords,
        newsletter.description ?? newsletter.title,
        newsletter.frequency,
      );
      const avg = (items.reduce((s, i) => s + i.combinedScore, 0) / items.length).toFixed(2);
      logger.info(`Scored ${items.length} items — avg: ${avg}`);
      return items;
    });

    // 5. Filter + rank
    const passingItems = await step.run("filter-items", async () => {
      const items = filterItems(scoredItems);
      logger.info(`${items.length}/${scoredItems.length} items passed threshold`);
      for (const item of items) {
        logger.info(`  [${item.combinedScore}] ${item.title}`);
      }
      return items;
    });

    await step.run("save-scored-items", () =>
      saveDigestItems(digestRun.id, allCandidates, passingItems),
    );

    if (passingItems.length === 0) {
      logger.warn("No items passed score threshold — marking run as failed");
      await failDigestRun(digestRun.id, "No items passed score threshold");
      return { digestRunId: digestRun.id, skipped: true, reason: "no passing items" };
    }

    // 6. Synthesize
    const digest = await step.run("synthesize", async () => {
      logger.info(`Synthesizing from ${passingItems.length} items`);
      const result = await synthesize(
        passingItems,
        newsletter.title,
        newsletter.description ?? newsletter.title,
        newsletter.frequency,
      );
      logger.info(
        `Synthesis complete — "${result.editionTitle}", ${result.sections.length} section(s), ${result.keyTakeaways.length} takeaway(s)`,
      );
      return result;
    });

    // 7. Render email
    const emailHtml = await step.run("render-email", async () => {
      const html = renderEmail(digest, newsletter.title, newsletter.frequency);
      logger.info(`Email rendered (${html.length} chars)`);
      return html;
    });

    // 8. Persist final content
    await step.run("save-digest-content", async () => {
      await saveDigestContent(digestRun.id, digest, emailHtml);
      logger.info("Digest content saved");
    });

    // 9. Fan out emails
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

    // 10. Mark as sent
    await step.run("mark-sent", async () => {
      await markDigestRunSent(digestRun.id);
      logger.info("Digest run marked as sent");
    });

    const recipientCount = recipientEmails.length || subscriptions.length;
    logger.info(`newsletter-worker complete — digestRunId: ${digestRun.id}, recipients: ${recipientCount}`);
    return { digestRunId: digestRun.id, recipientCount };
  },
);
