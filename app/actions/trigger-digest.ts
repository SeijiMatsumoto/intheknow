"use server";

import { inngest } from "@/inngest/client";

export async function triggerDigest(newsletterId: string) {
  await inngest.send({
    name: "newsletter/run",
    data: { newsletterId, userEmails: ["seijim27@gmail.com"] },
  });
}
