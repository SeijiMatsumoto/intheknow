"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canUse } from "@/lib/gates";
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

export async function createNewsletter(formData: FormData) {
  const title = formData.get("title") as string;
  const slug = (formData.get("slug") as string) || slugify(title);
  const description = (formData.get("description") as string) || null;
  const frequency = formData.get("frequency") as string;
  const keywords = parseCommas(formData.get("keywords") as string);
  const rss = parseLines(formData.get("rss") as string);
  const twitter_queries = parseLines(formData.get("twitter_queries") as string);
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
      sources: { rss, twitter_queries, sites },
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
  const twitter_queries = parseLines(formData.get("twitter_queries") as string);
  const sites = parseLines(formData.get("sites") as string);
  const { scheduleDays, scheduleHour } = parseSchedule(formData);

  await prisma.newsletter.update({
    where: { id },
    data: {
      title,
      slug,
      description,
      frequency,
      scheduleDays,
      scheduleHour,
      keywords,
      sources: { rss, twitter_queries, sites },
    },
  });

  revalidatePath("/internal");
  redirect("/internal");
}

export async function deleteNewsletter(id: string) {
  await prisma.newsletter.delete({ where: { id } });
  revalidatePath("/internal");
  redirect("/internal");
}

export async function deleteNewsletterById(id: string) {
  await prisma.newsletter.delete({ where: { id } });
  revalidatePath("/internal");
  revalidatePath("/newsletters");
}

export async function createUserNewsletter(data: {
  title: string;
  description: string;
  categoryId: string;
  frequency: string;
  scheduleDays: string[];
  scheduleHour: number;
  keywords: string[];
}): Promise<{ error?: string }> {
  try {
    const { userId } = await auth();
    if (!userId) return { error: "Not authenticated" };
    if (!(await canUse(userId, "custom_newsletter")))
      return { error: "Pro plan required" };

    const slug = `${slugify(data.title)}-${Math.random().toString(36).slice(2, 7)}`;

    await prisma.newsletter.create({
      data: {
        title: data.title,
        slug,
        description: data.description || null,
        categoryId: data.categoryId,
        frequency: data.frequency,
        scheduleDays: data.scheduleDays,
        scheduleHour: data.scheduleHour,
        keywords: data.keywords,
        sources: { rss: [], twitter_queries: [], sites: [] },
        createdBy: userId,
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
