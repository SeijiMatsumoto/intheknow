"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { canUse } from "@/lib/gates";
import { prisma } from "@/lib/prisma";

export async function subscribe(newsletterId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");

  await prisma.subscription.create({
    data: {
      userId,
      newsletterId,
      digestLength: "standard",
    },
  });

  revalidatePath("/newsletters");
}

export async function unsubscribe(subscriptionId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");

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
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");
  if (!(await canUse(userId, "custom_schedule"))) throw new Error("Pro plan required");

  await prisma.subscription.updateMany({
    where: { id: subscriptionId, userId },
    data: { scheduleDays, scheduleHour },
  });

  revalidatePath("/newsletters");
}
