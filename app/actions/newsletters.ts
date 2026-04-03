"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { ALL_DAYS, type Frequency } from "@/lib/date-utils";
import { canUse, getLimit } from "@/lib/gates";
import { prisma } from "@/lib/prisma";

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseLines(value: string): string[] {
  return value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseCommas(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseSchedule(formData: FormData) {
  return {
    scheduleDays: formData.getAll("scheduleDays") as string[],
    scheduleHour: Number(formData.get("scheduleHour") ?? 8),
  };
}

async function deleteNewsletterCascade(newsletterId: string) {
  const runs = await prisma.digestRun.findMany({
    where: { newsletterId },
    select: { id: true },
  });
  if (runs.length > 0) {
    const runIds = runs.map((r) => r.id);
    await prisma.digestFeedback.deleteMany({
      where: { runId: { in: runIds } },
    });
    await prisma.digestSend.deleteMany({ where: { runId: { in: runIds } } });
    await prisma.digestRun.deleteMany({ where: { newsletterId } });
  }
  await prisma.subscription.deleteMany({ where: { newsletterId } });
  await prisma.newsletter.delete({ where: { id: newsletterId } });
}

export async function createNewsletter(formData: FormData) {
  const title = formData.get("title") as string;
  const slug = (formData.get("slug") as string) || slugify(title);
  const description = (formData.get("description") as string) || null;
  const frequency = formData.get("frequency") as string;
  const keywords = parseCommas(formData.get("keywords") as string);
  const rss = parseLines(formData.get("rss") as string);
  const bluesky_queries = parseLines(formData.get("bluesky_queries") as string);
  const sites = parseLines(formData.get("sites") as string);
  const { scheduleDays, scheduleHour } = parseSchedule(formData);

  await prisma.newsletter.create({
    data: {
      title,
      slug,
      description,
      frequency,
      scheduleDays,
      scheduleHour,
      keywords,
      sources: { rss, bluesky_queries, sites },
      newsletterSources: {
        create: [
          ...rss.map((url) => ({ type: "rss", url })),
          ...sites.map((url) => ({ type: "site", url })),
          ...bluesky_queries.map((url) => ({ type: "bluesky_query", url })),
        ],
      },
    },
  });

  revalidatePath("/internal");
  redirect("/internal");
}

export async function updateNewsletter(id: string, formData: FormData) {
  const title = formData.get("title") as string;
  const slug = (formData.get("slug") as string) || slugify(title);
  const description = (formData.get("description") as string) || null;
  const frequency = formData.get("frequency") as string;
  const keywords = parseCommas(formData.get("keywords") as string);
  const rss = parseLines(formData.get("rss") as string);
  const bluesky_queries = parseLines(formData.get("bluesky_queries") as string);
  const sites = parseLines(formData.get("sites") as string);
  const { scheduleDays, scheduleHour } = parseSchedule(formData);

  await prisma.$transaction(async (tx) => {
    await tx.newsletter.update({
      where: { id },
      data: {
        title,
        slug,
        description,
        frequency,
        scheduleDays,
        scheduleHour,
        keywords,
        sources: { rss, bluesky_queries, sites },
      },
    });

    // Replace normalized sources (delete + recreate)
    await tx.newsletterSource.deleteMany({ where: { newsletterId: id } });
    await tx.newsletterSource.createMany({
      data: [
        ...rss.map((url) => ({ newsletterId: id, type: "rss" as const, url })),
        ...sites.map((url) => ({ newsletterId: id, type: "site" as const, url })),
        ...bluesky_queries.map((url) => ({ newsletterId: id, type: "bluesky_query" as const, url })),
      ],
    });
  });

  revalidatePath("/internal");
  redirect("/internal");
}

export async function deleteNewsletter(id: string) {
  await deleteNewsletterCascade(id);
  revalidatePath("/internal");
  redirect("/internal");
}

export async function deleteNewsletterById(id: string) {
  await deleteNewsletterCascade(id);
  revalidatePath("/internal");
  revalidatePath("/newsletters");
}

export async function deleteCustomNewsletter(
  newsletterId: string,
): Promise<{ error?: string }> {
  try {
    const userId = await requireAuth();

    const newsletter = await prisma.newsletter.findUnique({
      where: { id: newsletterId },
    });
    if (!newsletter) return { error: "Newsletter not found" };
    if (newsletter.createdBy !== userId)
      return { error: "You can only delete your own newsletters" };

    await deleteNewsletterCascade(newsletterId);

    revalidatePath("/newsletters");
    return {};
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to delete newsletter",
    };
  }
}

export async function createUserNewsletter(data: {
  title: string;
  description: string;
  categoryId: string;
  frequency: Frequency;
  scheduleDays: string[];
  scheduleHour: number;
  keywords: string[];
}): Promise<{ error?: string }> {
  try {
    const userId = await requireAuth();
    if (!(await canUse(userId, "custom_newsletter")))
      return { error: "Pro plan required" };

    const maxCustom = await getLimit(userId, "max_custom_newsletters");
    const currentCount = await prisma.newsletter.count({
      where: { createdBy: userId },
    });
    if (currentCount >= maxCustom) {
      return {
        error: `You've reached the limit of ${maxCustom} custom newsletters. Contact support to request more.`,
      };
    }

    const slug = `${slugify(data.title)}-${Math.random().toString(36).slice(2, 7)}`;
    const scheduleDays =
      data.frequency === "daily" && data.scheduleDays.length === 0
        ? [...ALL_DAYS]
        : data.scheduleDays;

    await prisma.newsletter.create({
      data: {
        title: data.title,
        slug,
        description: data.description || null,
        categoryId: data.categoryId,
        frequency: data.frequency,
        scheduleDays,
        scheduleHour: data.scheduleHour,
        keywords: data.keywords,
        sources: { rss: [], bluesky_queries: [], sites: [] },
        createdBy: userId,
        // No newsletterSources to create — user newsletters start with empty sources
      },
    });

    revalidatePath("/newsletters");
    return {};
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to create newsletter",
    };
  }
}
