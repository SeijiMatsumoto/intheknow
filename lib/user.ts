import { cache } from "react";
import { prisma } from "@/lib/prisma";

export type Plan = "free" | "plus" | "pro" | "admin";

/** Display labels for each plan. */
export const PLAN_LABELS: Record<Plan, string> = {
  free: "Free",
  plus: "Plus",
  pro: "Pro",
  admin: "Admin",
};

export const getUserPlan = cache(async (userId: string): Promise<Plan> => {
  const userPlan = await prisma.userPlan.findUnique({
    where: { userId },
  });
  const dbPlan = (userPlan?.plan as Plan) ?? "free";

  if (dbPlan === "admin") {
    const { getPlanOverride } = await import("@/app/actions/admin");
    const override = await getPlanOverride();
    if (override) return override;
  }

  return dbPlan;
});

/** True for plus, pro, or admin. */
export function isPaid(plan: Plan): boolean {
  return plan !== "free";
}

/** True for pro or admin. */
export function isPro(plan: Plan): boolean {
  return plan === "pro" || plan === "admin";
}

export function isAdmin(plan: Plan): boolean {
  return plan === "admin";
}
