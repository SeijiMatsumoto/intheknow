"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

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
}

export async function updateSubscriptionSchedule(
  subscriptionId: string,
  scheduleDays: string[],
  scheduleHour: number | null,
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");

  await prisma.subscription.updateMany({
    where: { id: subscriptionId, userId },
    data: { scheduleDays, scheduleHour },
  });

  revalidatePath("/newsletters");
}
