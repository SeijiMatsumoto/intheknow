import type { InputJsonValue } from "@prisma/client/runtime/client";
import { subHours } from "date-fns";
import { prisma } from "@/lib/prisma";
import type { DigestContent } from "./newsletter-agent";
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
    select: {
      sections: {
        select: {
          stories: {
            select: { title: true },
            orderBy: { sortOrder: "asc" },
          },
        },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
  if (!run) return [];
  return run.sections.flatMap((s) => s.stories.map((story) => story.title));
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

export async function saveDigestContent(
  id: string,
  content: DigestContent,
  emailHtml: string,
) {
  await prisma.$transaction(async (tx) => {
    // Write to JSON column (existing behavior) + new scalar columns
    await tx.digestRun.update({
      where: { id },
      data: {
        content: content as unknown as InputJsonValue,
        emailHtml,
        editionTitle: content.editionTitle ?? null,
        summary: content.summary ?? null,
        keyTakeaways: content.keyTakeaways ?? [],
        socialConsensusOverview: content.socialConsensus?.overview ?? null,
        bottomLine: content.bottomLine ?? null,
        agentSummary: content.agentSummary ?? null,
        skipEdition: content.skipEdition ?? false,
      },
    });

    // Write to normalized tables
    for (const [si, section] of content.sections.entries()) {
      const sec = await tx.digestSection.create({
        data: { runId: id, heading: section.heading, sortOrder: si },
      });

      for (const [ii, item] of section.items.entries()) {
        const story = await tx.digestStory.create({
          data: {
            sectionId: sec.id,
            title: item.title,
            category: item.category ?? "",
            icon: item.icon ?? "flame",
            detail: item.detail ?? "",
            quote: item.quote ?? null,
            sortOrder: ii,
          },
        });

        for (const [srcIdx, source] of (item.sources ?? []).entries()) {
          await tx.digestStorySource.create({
            data: {
              storyId: story.id,
              url: source.url,
              name: source.name,
              publishedAt: source.publishedAt ?? null,
              sortOrder: srcIdx,
            },
          });
        }
      }
    }

    if (content.socialConsensus?.highlights) {
      for (const [i, h] of content.socialConsensus.highlights.entries()) {
        await tx.digestSocialHighlight.create({
          data: {
            runId: id,
            text: h.text,
            author: h.author,
            authorName: h.authorName,
            url: h.url,
            engagement: h.engagement ?? null,
            sortOrder: i,
          },
        });
      }
    }
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
