import { inngest } from "@/inngest/client";
import { resend } from "@/lib/resend";
import { createDigestSend } from "./queries";

export const emailSender = inngest.createFunction(
  {
    id: "email-sender",
    retries: 3,
    triggers: [{ event: "newsletter/email.generated" }],
  },
  async ({ event, logger }) => {
    const { digestRunId, newsletterTitle, userId, userEmail, emailHtml } =
      event.data;
    logger.info(`Sending email to ${userEmail}`, {
      digestRunId,
      userId,
      subject: newsletterTitle,
    });

    const { data, error } = await resend.emails.send({
      from: "The Latest <onboarding@resend.dev>",
      to: userEmail,
      subject: newsletterTitle,
      html: emailHtml,
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
