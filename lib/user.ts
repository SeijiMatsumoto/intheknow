import { prisma } from "@/lib/prisma";

export async function getUserPlan(userId: string): Promise<"free" | "pro"> {
  const userPlan = await prisma.userPlan.findUnique({
    where: { userId },
  });
  return (userPlan?.plan as "free" | "pro") ?? "free";
}

export function isPro(plan: "free" | "pro"): boolean {
  return plan === "pro";
}
