import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";

export const emailSender = inngest.createFunction(
  {
    id: "email-sender",
    retries: 3,
    triggers: [{ event: "newsletter/email.generated" }],
  },
  async ({ event }) => {
    const { digestRunId, newsletterTitle, userId, userEmail, emailHtml } =
      event.data;

    const { data, error } = await resend.emails.send({
      from: "The Latest <digest@thelatest.ai>",
      to: userEmail,
      subject: newsletterTitle,
      html: emailHtml,
    });

    await prisma.digestSend.create({
      data: {
        runId: digestRunId,
        userId,
        sentAt: error ? null : new Date(),
        status: error ? "failed" : "sent",
      },
    });

    if (error) throw new Error(`Resend error: ${JSON.stringify(error)}`);

    return { userId, messageId: data?.id };
  },
);
