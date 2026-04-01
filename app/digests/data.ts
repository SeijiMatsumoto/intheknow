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

  // Fetch all completed digest runs for subscribed newsletters
  const runs = subscribedIds.length > 0
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
      })
    : [];

  // Normalize runs into the same shape as sends
  const fromRuns = runs.map((run) => ({
    id: run.id, // use run id as the "send" id
    sentAt: run.runAt,
    run: {
      id: run.id,
      content: run.content,
      newsletter: run.newsletter,
    },
  }));

  const fromManual = manualSends.map((s) => ({
    id: s.id,
    sentAt: s.sentAt,
    run: {
      id: s.run.id,
      content: s.run.content,
      newsletter: s.run.newsletter,
    },
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

  const [totalDigests, digestsThisWeek] = subscribedIds.length > 0
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
  const recentRuns = subscribedIds.length > 0
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
  // First try finding a direct send for this user
  const send = await prisma.digestSend.findFirst({
    where: { runId, userId: { in: userIds(userId, admin) } },
    include: {
      run: {
        include: {
          newsletter: { select: { title: true, slug: true, categoryId: true } },
        },
      },
    },
  });
  if (send) return send;

  // Fall back: allow access if user is subscribed to this newsletter
  const run = await prisma.digestRun.findUnique({
    where: { id: runId },
    include: {
      newsletter: { select: { id: true, title: true, slug: true, categoryId: true } },
    },
  });
  if (!run) return null;

  const subscription = await prisma.subscription.findFirst({
    where: { userId, newsletterId: run.newsletterId, pausedAt: null },
  });
  if (!subscription) return null;

  // Return in the same shape as a DigestSend record
  return {
    id: run.id,
    runId: run.id,
    userId,
    sentAt: run.runAt,
    status: "sent" as const,
    run: {
      id: run.id,
      newsletterId: run.newsletterId,
      runAt: run.runAt,
      status: run.status,
      content: run.content,
      emailHtml: run.emailHtml,
      error: run.error,
      createdAt: run.createdAt,
      newsletter: {
        title: run.newsletter.title,
        slug: run.newsletter.slug,
        categoryId: run.newsletter.categoryId,
      },
    },
  };
}

export type DigestSource = {
  url: string;
  name: string;
  publishedAt?: string;
};

export type DigestItem = {
  title: string;
  category?: string;
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
