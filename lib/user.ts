import { cache } from "react";
import { prisma } from "@/lib/prisma";

export type Plan = "free" | "pro" | "admin";

export const getUserPlan = cache(async (userId: string): Promise<Plan> => {
  const userPlan = await prisma.userPlan.findUnique({
    where: { userId },
  });
  return (userPlan?.plan as Plan) ?? "free";
});

export function isPro(plan: Plan): boolean {
  return plan === "pro" || plan === "admin";
}

export function isAdmin(plan: Plan): boolean {
  return plan === "admin";
}
