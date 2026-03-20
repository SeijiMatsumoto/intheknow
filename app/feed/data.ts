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

export interface DigestItem {
  url: string;
  title: string;
  source: string;
  summary: string;
  quote?: string;
}

export interface DigestSection {
  heading: string;
  items: DigestItem[];
}

export interface DigestContent {
  title: string;
  summary: string;
  sections: DigestSection[];
  keyTakeaways: string[];
}
