import { inngest } from "@/inngest/client";
import { dailyOrchestrator } from "@/inngest/functions/daily-orchestrator";
import { emailSender } from "@/inngest/functions/email-sender";
import { newsletterWorker } from "@/inngest/functions/newsletter-worker";
import { weeklyOrchestrator } from "@/inngest/functions/weekly-orchestrator";
import { serve } from "inngest/next";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [weeklyOrchestrator, dailyOrchestrator, newsletterWorker, emailSender],
});
