import type { InputJsonValue } from "@prisma/client/runtime/client";
import { prisma } from "@/lib/prisma";

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

export function createDigestRun(newsletterId: string) {
  return prisma.digestRun.create({
    data: { newsletterId, runAt: new Date(), status: "running" },
  });
}

export function saveDigestItems(
  id: string,
  candidateItems: InputJsonValue,
  passingItems: InputJsonValue,
) {
  return prisma.digestRun.update({
    where: { id },
    data: { candidateItems, passingItems },
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
