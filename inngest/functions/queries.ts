import type { InputJsonValue } from "@prisma/client/runtime/client";
import { prisma } from "@/lib/prisma";
import type { Plan } from "@/lib/user";

// ── Subscriptions ────────────────────────────────────────────────────────────

export function getActiveSubscriptionsWithSchedule() {
  return prisma.subscription.findMany({
    where: { pausedAt: null },
    select: {
      userId: true,
      newsletterId: true,
      scheduleDays: true,
      scheduleHour: true,
      newsletter: {
        select: {
          id: true,
          title: true,
          scheduleDays: true,
          scheduleHour: true,
        },
      },
    },
  });
}

export function getNewsletterSubscriptions(
  newsletterId: string,
  userIds?: string[],
) {
  return prisma.subscription.findMany({
    where: {
      newsletterId,
      pausedAt: null,
      ...(userIds ? { userId: { in: userIds } } : {}),
    },
  });
}

const TIER_RANK: Record<Plan, number> = {
  free: 0,
  plus: 1,
  pro: 2,
  admin: 3,
};

/** Return the highest plan among a set of userIds. Defaults to "free". */
export async function highestTierAmong(userIds: string[]): Promise<Plan> {
  if (userIds.length === 0) return "free";
  const plans = await prisma.userPlan.findMany({
    where: { userId: { in: userIds } },
    select: { plan: true },
  });
  let best: Plan = "free";
  for (const { plan } of plans) {
    const p = plan as Plan;
    if (TIER_RANK[p] > TIER_RANK[best]) best = p;
  }
  return best;
}

// ── Newsletter ────────────────────────────────────────────────────────────────

export function getNewsletterById(id: string) {
  return prisma.newsletter.findUniqueOrThrow({ where: { id } });
}

// ── Digest runs ───────────────────────────────────────────────────────────────

export function findRecentDigestRun(newsletterId: string, since: Date) {
  return prisma.digestRun.findFirst({
    where: { newsletterId, status: "sent", runAt: { gte: since } },
    orderBy: { runAt: "desc" },
  });
}

export function createDigestRun(newsletterId: string, id?: string) {
  return prisma.digestRun.create({
    data: { ...(id ? { id } : {}), newsletterId, runAt: new Date(), status: "running" },
  });
}

export function saveDigestContent(
  id: string,
  content: InputJsonValue,
  emailHtml: string,
) {
  return prisma.digestRun.update({
    where: { id },
    data: { content, emailHtml },
  });
}

export function failDigestRun(id: string, error: string) {
  return prisma.digestRun.update({
    where: { id },
    data: { status: "failed", error },
  });
}


export function markDigestRunSent(id: string) {
  return prisma.digestRun.update({
    where: { id },
    data: { status: "sent" },
  });
}

// ── Digest sends ──────────────────────────────────────────────────────────────

export function createDigestSend(
  runId: string,
  userId: string,
  status: "sent" | "failed",
  sentAt: Date | null,
) {
  return prisma.digestSend.create({
    data: { runId, userId, sentAt, status },
  });
}
