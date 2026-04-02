"use server";

import { inngest } from "@/inngest/client";
import type { Plan } from "@/lib/user";

export async function triggerDigest(newsletterId: string, tier: Plan = "free") {
  await inngest.send({
    name: "newsletter/run",
    data: {
      newsletterId,
      digestRunId: crypto.randomUUID(),
      tier,
      userEmails: ["seijim27@gmail.com"],
    },
  });
}
