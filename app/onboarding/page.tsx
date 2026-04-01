import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { OnboardingClient } from "./onboarding-client";

export default async function OnboardingPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const subCount = await prisma.subscription.count({ where: { userId } });
  if (subCount > 0) redirect("/newsletters");

  return <OnboardingClient />;
}
