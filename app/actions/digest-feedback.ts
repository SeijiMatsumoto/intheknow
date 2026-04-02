"use server";

import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function submitDigestFeedback(
  runId: string,
  rating: "up" | "down",
  comment: string | null,
): Promise<{ error?: string }> {
  const userId = await requireAuth();

  await prisma.digestFeedback.upsert({
    where: { runId_userId: { runId, userId } },
    create: { runId, userId, rating, comment },
    update: { rating, comment },
  });

  return {};
}

export async function getDigestFeedback(
  runId: string,
): Promise<{ rating: string; comment: string | null } | null> {
  let userId: string;
  try {
    userId = await requireAuth();
  } catch {
    return null;
  }

  return prisma.digestFeedback.findUnique({
    where: { runId_userId: { runId, userId } },
    select: { rating: true, comment: true },
  });
}
