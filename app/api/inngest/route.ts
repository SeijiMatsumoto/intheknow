import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { emailSender } from "@/inngest/functions/email-sender";
import { hourlyOrchestrator } from "@/inngest/functions/hourly-orchestrator";
import { newsletterWorker } from "@/inngest/functions/newsletter-worker";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [hourlyOrchestrator, newsletterWorker, emailSender],
});
