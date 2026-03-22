import { prisma } from "@/lib/prisma";

function userIds(userId: string, admin: boolean): string[] {
  return admin ? [userId, "manual"] : [userId];
}

export async function getFeedSends(userId: string, admin: boolean) {
  return prisma.digestSend.findMany({
    where: { userId: { in: userIds(userId, admin) }, status: "sent" },
    orderBy: { sentAt: "desc" },
    include: {
      run: {
        include: {
          newsletter: { select: { title: true, slug: true, categoryId: true } },
        },
      },
    },
  });
}

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
