import { inngest } from "@/inngest/client";
import { UNSUBSCRIBE_PLACEHOLDER } from "@/inngest/lib/render-email";
import { resend } from "@/lib/resend";
import { buildUnsubscribeUrl } from "@/lib/unsubscribe-token";
import { createDigestSend } from "./queries";

export const emailSender = inngest.createFunction(
  {
    id: "email-sender",
    retries: 3,
    triggers: [{ event: "newsletter/email.generated" }],
  },
  async ({ event, logger }) => {
    const {
      digestRunId,
      newsletterId,
      newsletterTitle,
      userId,
      userEmail,
      emailHtml,
    } = event.data;
    logger.info(`Sending email to ${userEmail}`, {
      digestRunId,
      userId,
      subject: newsletterTitle,
    });

    const unsubscribeUrl =
      userId !== "manual"
        ? buildUnsubscribeUrl(userId, newsletterId)
        : `${process.env.NEXT_PUBLIC_APP_URL ?? "https://thelatest.app"}/settings`;

    const html = emailHtml.replaceAll(UNSUBSCRIBE_PLACEHOLDER, unsubscribeUrl);

    const { data, error } = await resend.emails.send({
      from: "In The Know <onboarding@resend.dev>",
      to: userEmail,
      subject: newsletterTitle,
      html,
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });

    if (error) {
      logger.error(`Resend error for ${userEmail}`, { error });
      await createDigestSend(digestRunId, userId, "failed", null);
      throw new Error(`Resend error: ${JSON.stringify(error)}`);
    }

    logger.info(`Email sent to ${userEmail} — messageId: ${data?.id}`);
    await createDigestSend(digestRunId, userId, "sent", new Date());

    return { userId, userEmail, messageId: data?.id };
  },
);
