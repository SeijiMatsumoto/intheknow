"use server";

import { inngest } from "@/inngest/client";

export type DigestTier = "free" | "plus" | "pro";

export async function triggerDigest(newsletterId: string, tier: DigestTier = "pro") {
  await inngest.send({
    name: "newsletter/run",
    data: { newsletterId, tier, userEmails: ["seijim27@gmail.com"] },
  });
}
