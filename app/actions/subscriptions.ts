"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { canUse, getLimit } from "@/lib/gates";
import { prisma } from "@/lib/prisma";

export async function subscribe(
  newsletterId: string,
): Promise<{ error?: string }> {
  const userId = await requireAuth();

  const canMultiple = await canUse(userId, "multiple_subscriptions");

  if (!canMultiple) {
    const limit = await getLimit(userId, "max_subscriptions");
    const count = await prisma.subscription.count({ where: { userId } });
    if (count >= limit) {
      return {
        error: `Free plan is limited to ${limit} subscription. Upgrade to Pro for unlimited.`,
      };
    }
  }

  await prisma.subscription.create({
    data: {
      userId,
      newsletterId,
    },
  });

  revalidatePath("/newsletters");
  return {};
}

export async function unsubscribe(subscriptionId: string) {
  const userId = await requireAuth();

  await prisma.subscription.deleteMany({
    where: { id: subscriptionId, userId },
  });

  revalidatePath("/newsletters");
  revalidatePath("/settings");
}

export async function updateSubscriptionSchedule(
  subscriptionId: string,
  scheduleDays: string[],
  scheduleHour: number | null,
) {
  const userId = await requireAuth();
  if (!(await canUse(userId, "custom_schedule")))
    throw new Error("Pro plan required");

  await prisma.subscription.updateMany({
    where: { id: subscriptionId, userId },
    data: { scheduleDays, scheduleHour },
  });

  revalidatePath("/newsletters");
}
