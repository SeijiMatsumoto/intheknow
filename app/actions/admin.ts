"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import type { Plan } from "@/lib/user";

const COOKIE_NAME = "admin_plan_override";
const VALID_PLANS: Plan[] = ["free", "plus", "pro", "admin"];

export async function setPlanOverride(plan: Plan) {
  const { userId } = await auth();
  if (!userId) return;

  const realPlan = await getRealPlan(userId);
  if (realPlan !== "admin") return;

  const jar = await cookies();

  if (plan === "admin") {
    jar.delete(COOKIE_NAME);
  } else {
    jar.set(COOKIE_NAME, plan, { httpOnly: true, sameSite: "lax", path: "/" });
  }

  revalidatePath("/", "layout");
}

export async function getPlanOverride(): Promise<Plan | null> {
  const jar = await cookies();
  const value = jar.get(COOKIE_NAME)?.value as Plan | undefined;
  if (value && VALID_PLANS.includes(value)) return value;
  return null;
}

async function getRealPlan(userId: string): Promise<Plan> {
  const { prisma } = await import("@/lib/prisma");
  const row = await prisma.userPlan.findUnique({ where: { userId } });
  return (row?.plan as Plan) ?? "free";
}
