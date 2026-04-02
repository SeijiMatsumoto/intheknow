import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST() {
  const userId = await requireAuth();

  const userPlan = await prisma.userPlan.findUnique({ where: { userId } });

  if (!userPlan?.stripeCustomerId) {
    return NextResponse.json(
      { error: "No billing account found" },
      { status: 400 },
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const session = await stripe.billingPortal.sessions.create({
    customer: userPlan.stripeCustomerId,
    return_url: `${appUrl}/settings?tab=plans`,
  });

  return NextResponse.json({ url: session.url });
}
