"use server";

import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getLimit } from "@/lib/gates";
import { prisma } from "@/lib/prisma";

export async function getNewslettersByCategories(categoryIds: string[]) {
  const userId = await requireAuth();

  if (categoryIds.length === 0) return { newsletters: [], maxSubscriptions: 0 };

  const [newsletters, limit, existing] = await Promise.all([
    prisma.newsletter.findMany({
      where: {
        createdBy: null,
        categoryId: { in: categoryIds },
      },
      orderBy: { title: "asc" },
      select: {
        id: true,
        title: true,
        description: true,
        frequency: true,
        categoryId: true,
        keywords: true,
      },
    }),
    getLimit(userId, "max_subscriptions"),
    prisma.subscription.count({ where: { userId } }),
  ]);

  return { newsletters, maxSubscriptions: limit - existing };
}

export async function completeOnboarding(input: { newsletterIds: string[] }) {
  const userId = await requireAuth();

  // Bulk subscribe, respecting plan limits
  if (input.newsletterIds.length > 0) {
    const limit = await getLimit(userId, "max_subscriptions");
    const existing = await prisma.subscription.count({ where: { userId } });
    const toCreate = input.newsletterIds.slice(0, limit - existing);

    if (toCreate.length > 0) {
      await prisma.subscription.createMany({
        data: toCreate.map((newsletterId) => ({
          userId,
          newsletterId,
        })),
        skipDuplicates: true,
      });
    }
  }

  redirect("/newsletters");
}
