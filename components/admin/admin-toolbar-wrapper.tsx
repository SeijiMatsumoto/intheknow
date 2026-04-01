import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getUserPlan } from "@/lib/user";
import { AdminToolbar } from "./admin-toolbar";

export async function AdminToolbarWrapper() {
  const { userId } = await auth();
  if (!userId) return null;

  const row = await prisma.userPlan.findUnique({ where: { userId } });
  const dbPlan = row?.plan;
  if (dbPlan !== "admin") return null;

  const activePlan = await getUserPlan(userId);

  return <AdminToolbar activePlan={activePlan} />;
}
