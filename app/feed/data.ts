import { prisma } from "@/lib/prisma";

function userIds(userId: string, admin: boolean): string[] {
  return admin ? [userId, "manual"] : [userId];
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

  return prisma.digestSend.findMany({
    where: {
      userId: { in: userIds(userId, admin) },
      status: "sent",
      ...(since ? { sentAt: { gte: since } } : {}),
      run: {
        ...(filters.newsletter
          ? { newsletter: { slug: filters.newsletter } }
          : {}),
        ...(filters.frequency
          ? { newsletter: { frequency: filters.frequency } }
          : {}),
      },
    },
    orderBy: { sentAt: "desc" },
    take: limit + 1,
    include: {
      run: {
        include: {
          newsletter: {
            select: {
              title: true,
              slug: true,
              categoryId: true,
              frequency: true,
            },
          },
        },
      },
    },
  });
}

/** Get all newsletters a user has received sends for (for filter dropdown). */
export async function getFeedNewsletters(userId: string, admin: boolean) {
  const sends = await prisma.digestSend.findMany({
    where: { userId: { in: userIds(userId, admin) }, status: "sent" },
    select: {
      run: {
        select: {
          newsletter: { select: { slug: true, title: true, frequency: true } },
        },
      },
    },
    distinct: ["runId"],
  });

  const map = new Map<string, { title: string; frequency: string }>();
  for (const s of sends) {
    const nl = s.run.newsletter;
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
export async function getFeedStats(userId: string, admin: boolean) {
  const ids = userIds(userId, admin);

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [totalDigests, digestsThisWeek, subscriptions] = await Promise.all([
    prisma.digestSend.count({
      where: { userId: { in: ids }, status: "sent" },
    }),
    prisma.digestSend.count({
      where: { userId: { in: ids }, status: "sent", sentAt: { gte: weekAgo } },
    }),
    prisma.subscription.findMany({
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
    }),
  ]);

  // Find most recent send per newsletter
  const recentSends = await prisma.digestSend.findMany({
    where: { userId: { in: ids }, status: "sent" },
    orderBy: { sentAt: "desc" },
    distinct: ["runId"],
    take: 50,
    select: {
      sentAt: true,
      run: { select: { newsletter: { select: { slug: true } } } },
    },
  });

  const lastSentBySlug = new Map<string, Date>();
  for (const s of recentSends) {
    const slug = s.run.newsletter.slug;
    if (!lastSentBySlug.has(slug) && s.sentAt) {
      lastSentBySlug.set(slug, s.sentAt);
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
      lastSentAt: lastSentBySlug.get(sub.newsletter.slug)?.toISOString() ?? null,
    })),
  };
}

export type FeedStats = Awaited<ReturnType<typeof getFeedStats>>;

export async function getFeedDigest(
  runId: string,
  userId: string,
  admin: boolean,
) {
  return prisma.digestSend.findFirst({
    where: { runId, userId: { in: userIds(userId, admin) } },
    include: {
      run: {
        include: {
          newsletter: { select: { title: true, slug: true, categoryId: true } },
        },
      },
    },
  });
}

export type DigestSource = {
  url: string;
  name: string;
  publishedAt?: string;
};

export type DigestItem = {
  title: string;
  icon?: string;
  detail?: string;
  quote?: string;
  sources?: DigestSource[];
  // Backward compat for old digests stored in DB
  url?: string;
  source?: string;
  publishedAt?: string;
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

export type SocialConsensus = {
  overview: string;
  highlights: SocialHighlight[];
};

export type DigestContent = {
  editionTitle: string;
  title: string;
  summary: string;
  sections: DigestSection[];
  keyTakeaways: string[];
  socialConsensus?: SocialConsensus | null;
  bottomLine?: string;
  agentSummary?: string;
};
