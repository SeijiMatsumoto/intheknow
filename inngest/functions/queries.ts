import type { InputJsonValue } from "@prisma/client/runtime/client";
import { subHours } from "date-fns";
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

/** Return a map of userId → Plan for a set of userIds. Missing users default to "free". */
export async function getUserPlans(
  userIds: string[],
): Promise<Map<string, Plan>> {
  if (userIds.length === 0) return new Map();
  const rows = await prisma.userPlan.findMany({
    where: { userId: { in: userIds } },
    select: { userId: true, plan: true },
  });
  const map = new Map<string, Plan>();
  for (const row of rows) {
    map.set(row.userId, row.plan as Plan);
  }
  return map;
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

/**
 * Check if a digest run was already skipped (no stories) recently.
 * Uses a short window (2 hours) instead of the full period — if news breaks
 * later in the day, a later scheduled run should re-try the agent.
 */
export function findSkippedDigestRun(newsletterId: string) {
  const twoHoursAgo = subHours(new Date(), 2);
  return prisma.digestRun.findFirst({
    where: { newsletterId, status: "skipped", runAt: { gte: twoHoursAgo } },
    orderBy: { runAt: "desc" },
  });
}

/** Fetch item titles from the most recent sent digest for dedup. */
export async function getPriorDigestTitles(
  newsletterId: string,
): Promise<string[]> {
  const run = await prisma.digestRun.findFirst({
    where: { newsletterId, status: "sent" },
    orderBy: { runAt: "desc" },
    select: { content: true },
  });
  if (!run?.content) return [];
  const content = run.content as {
    sections?: { items?: { title: string }[] }[];
  };
  return (
    content.sections?.flatMap((s) => s.items?.map((i) => i.title) ?? []) ?? []
  );
}

export function createDigestRun(newsletterId: string, id?: string) {
  return prisma.digestRun.create({
    data: {
      ...(id ? { id } : {}),
      newsletterId,
      runAt: new Date(),
      status: "running",
    },
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

export function skipDigestRun(id: string) {
  return prisma.digestRun.update({
    where: { id },
    data: { status: "skipped", error: "No stories found — edition skipped" },
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
