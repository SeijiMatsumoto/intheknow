import type { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";

function userIds(userId: string, admin: boolean): string[] {
  return admin ? [userId, "manual"] : [userId];
}

// Prisma include for loading normalized digest content
const digestContentInclude = {
  sections: {
    orderBy: { sortOrder: "asc" },
    include: {
      stories: {
        orderBy: { sortOrder: "asc" },
        include: {
          sources: { orderBy: { sortOrder: "asc" } },
        },
      },
    },
  },
  socialHighlights: { orderBy: { sortOrder: "asc" } },
} satisfies Prisma.DigestRunInclude;

type DigestRunWithRelations = Prisma.DigestRunGetPayload<{
  include: typeof digestContentInclude;
}>;

/** Transform a DigestRun with included relations into a flat DigestContent. */
function toDigestContent(run: DigestRunWithRelations): DigestContent {
  return {
    editionTitle: run.editionTitle,
    summary: run.summary,
    keyTakeaways: run.keyTakeaways,
    sections: run.sections.map((s: DigestRunWithRelations["sections"][number]) => ({
      heading: s.heading,
      items: s.stories.map((story: DigestRunWithRelations["sections"][number]["stories"][number]) => ({
        title: story.title,
        category: story.category,
        icon: story.icon,
        detail: story.detail,
        quote: story.quote,
        sources: story.sources.map((src: DigestRunWithRelations["sections"][number]["stories"][number]["sources"][number]) => ({
          url: src.url,
          name: src.name,
          publishedAt: src.publishedAt,
        })),
      })),
    })),
    socialConsensusOverview: run.socialConsensusOverview,
    socialHighlights: run.socialHighlights.map((h: DigestRunWithRelations["socialHighlights"][number]) => ({
      text: h.text,
      author: h.author,
      authorName: h.authorName,
      url: h.url,
      engagement: h.engagement,
    })),
    bottomLine: run.bottomLine,
    agentSummary: run.agentSummary,
  };
}

export type FeedFilters = {
  newsletter?: string;
  frequency?: string;
  dateRange?: string;
  limit?: number;
};

const PAGE_SIZE = 20;

function dateRangeFilter(range: string | undefined): Date | undefined {
  if (!range) return undefined;
  const now = new Date();
  switch (range) {
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "90d":
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    default:
      return undefined;
  }
}

export async function getFeedSends(
  userId: string,
  admin: boolean,
  filters: FeedFilters = {},
) {
  const limit = filters.limit ?? PAGE_SIZE;
  const since = dateRangeFilter(filters.dateRange);

  // Get newsletter IDs the user is subscribed to
  const subscriptions = await prisma.subscription.findMany({
    where: { userId, pausedAt: null },
    select: { newsletterId: true },
  });
  const subscribedIds = subscriptions.map((s) => s.newsletterId);

  const newsletterFilter = {
    ...(filters.newsletter ? { slug: filters.newsletter } : {}),
    ...(filters.frequency ? { frequency: filters.frequency } : {}),
  };

  const feedRunSelect = {
    id: true,
    runAt: true,
    editionTitle: true,
    summary: true,
    keyTakeaways: true,
    sections: {
      select: {
        heading: true,
        _count: { select: { stories: true } },
      },
      orderBy: { sortOrder: "asc" as const },
    },
    newsletter: {
      select: {
        title: true,
        slug: true,
        categoryId: true,
        frequency: true,
      },
    },
  } satisfies Prisma.DigestRunSelect;

  // Fetch all completed digest runs for subscribed newsletters
  const runs =
    subscribedIds.length > 0
      ? await prisma.digestRun.findMany({
          where: {
            newsletterId: { in: subscribedIds },
            status: "sent",

            ...(since ? { runAt: { gte: since } } : {}),
            ...(Object.keys(newsletterFilter).length > 0
              ? { newsletter: newsletterFilter }
              : {}),
          },
          orderBy: { runAt: "desc" },
          take: limit + 1,
          select: feedRunSelect,
        })
      : [];

  // Also include admin "manual" sends
  const manualSends = admin
    ? await prisma.digestSend.findMany({
        where: {
          userId: "manual",
          status: "sent",
          ...(since ? { sentAt: { gte: since } } : {}),
          run: {
            ...(Object.keys(newsletterFilter).length > 0
              ? { newsletter: newsletterFilter }
              : {}),
          },
        },
        orderBy: { sentAt: "desc" },
        take: limit + 1,
        include: {
          run: { select: feedRunSelect },
        },
      })
    : [];

  // Normalize runs into the same shape as sends
  const fromRuns = runs.map((run) => ({
    id: run.id,
    sentAt: run.runAt as Date | null,
    run,
  }));

  const fromManual = manualSends.map((s) => ({
    id: s.id,
    sentAt: s.sentAt,
    run: s.run,
  }));

  // Merge and deduplicate by run id, sort by date desc
  const byRunId = new Map<string, (typeof fromRuns)[0]>();
  for (const item of [...fromRuns, ...fromManual]) {
    if (!byRunId.has(item.run.id)) {
      byRunId.set(item.run.id, item);
    }
  }

  const merged = Array.from(byRunId.values()).sort((a, b) => {
    const da = a.sentAt ? new Date(a.sentAt).getTime() : 0;
    const db = b.sentAt ? new Date(b.sentAt).getTime() : 0;
    return db - da;
  });

  return merged.slice(0, limit + 1);
}

/** Get all newsletters the user is subscribed to (for filter dropdown). */
export async function getFeedNewsletters(userId: string, _admin: boolean) {
  const subscriptions = await prisma.subscription.findMany({
    where: { userId, pausedAt: null },
    select: {
      newsletter: {
        select: { slug: true, title: true, frequency: true },
      },
    },
  });

  const map = new Map<string, { title: string; frequency: string }>();
  for (const sub of subscriptions) {
    const nl = sub.newsletter;
    if (!map.has(nl.slug)) {
      map.set(nl.slug, { title: nl.title, frequency: nl.frequency });
    }
  }
  return Array.from(map.entries()).map(([slug, info]) => ({
    slug,
    ...info,
  }));
}

/** Stats for the feed sidebar. */
export async function getFeedStats(userId: string, _admin: boolean) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const subscriptions = await prisma.subscription.findMany({
    where: { userId, pausedAt: null },
    include: {
      newsletter: {
        select: {
          title: true,
          slug: true,
          frequency: true,
          scheduleDays: true,
          scheduleHour: true,
          categoryId: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const subscribedIds = subscriptions.map((s) => s.newsletterId);

  const [totalDigests, digestsThisWeek] =
    subscribedIds.length > 0
      ? await Promise.all([
          prisma.digestRun.count({
            where: {
              newsletterId: { in: subscribedIds },
              status: "sent",
            },
          }),
          prisma.digestRun.count({
            where: {
              newsletterId: { in: subscribedIds },
              status: "sent",

              runAt: { gte: weekAgo },
            },
          }),
        ])
      : [0, 0];

  // Find most recent run per newsletter
  const recentRuns =
    subscribedIds.length > 0
      ? await prisma.digestRun.findMany({
          where: {
            newsletterId: { in: subscribedIds },
            status: "sent",
          },
          orderBy: { runAt: "desc" },
          distinct: ["newsletterId"],
          take: 50,
          select: {
            runAt: true,
            newsletter: { select: { slug: true } },
          },
        })
      : [];

  const lastSentBySlug = new Map<string, Date>();
  for (const r of recentRuns) {
    const slug = r.newsletter.slug;
    if (!lastSentBySlug.has(slug)) {
      lastSentBySlug.set(slug, r.runAt);
    }
  }

  return {
    totalDigests,
    digestsThisWeek,
    subscriptions: subscriptions.map((sub) => ({
      newsletterTitle: sub.newsletter.title,
      newsletterSlug: sub.newsletter.slug,
      frequency: sub.newsletter.frequency,
      scheduleDays: sub.newsletter.scheduleDays,
      scheduleHour: sub.newsletter.scheduleHour,
      categoryId: sub.newsletter.categoryId,
      lastSentAt:
        lastSentBySlug.get(sub.newsletter.slug)?.toISOString() ?? null,
    })),
  };
}

export type FeedStats = Awaited<ReturnType<typeof getFeedStats>>;

export async function getFeedDigest(
  runId: string,
  userId: string,
  admin: boolean,
) {
  const digestRunInclude = {
    ...digestContentInclude,
    newsletter: { select: { id: true, title: true, slug: true, categoryId: true } },
  };

  // First try finding a direct send for this user
  const send = await prisma.digestSend.findFirst({
    where: { runId, userId: { in: userIds(userId, admin) } },
    include: { run: { include: digestRunInclude } },
  });

  if (send) {
    return {
      sentAt: send.sentAt,
      run: {
        id: send.run.id,
        runAt: send.run.runAt,
        newsletter: send.run.newsletter,
        content: toDigestContent(send.run),
      },
    };
  }

  // Fall back: allow access if user is subscribed to this newsletter
  const run = await prisma.digestRun.findUnique({
    where: { id: runId },
    include: digestRunInclude,
  });
  if (!run) return null;

  const subscription = await prisma.subscription.findFirst({
    where: { userId, newsletterId: run.newsletterId, pausedAt: null },
  });
  if (!subscription) return null;

  return {
    sentAt: run.runAt,
    run: {
      id: run.id,
      runAt: run.runAt,
      newsletter: run.newsletter,
      content: toDigestContent(run),
    },
  };
}

export type DigestSource = {
  url: string;
  name: string;
  publishedAt: string | null;
};

export type DigestItem = {
  title: string;
  category: string;
  icon: string;
  detail: string;
  quote: string | null;
  sources: DigestSource[];
};

export type DigestSection = {
  heading: string;
  items: DigestItem[];
};

export type SocialHighlight = {
  text: string;
  author: string;
  authorName: string;
  url: string;
  engagement: string | null;
};

export type DigestContent = {
  editionTitle: string | null;
  summary: string | null;
  keyTakeaways: string[];
  sections: DigestSection[];
  socialConsensusOverview: string | null;
  socialHighlights: SocialHighlight[];
  bottomLine: string | null;
  agentSummary: string | null;
};
