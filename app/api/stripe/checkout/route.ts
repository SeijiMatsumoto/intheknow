import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const userId = await requireAuth();

  const { priceId } = (await req.json()) as { priceId: string };
  if (!priceId) {
    return NextResponse.json({ error: "Missing priceId" }, { status: 400 });
  }

  const userPlan = await prisma.userPlan.findUnique({ where: { userId } });

  let customerId = userPlan?.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      metadata: { clerkUserId: userId },
    });
    customerId = customer.id;
    await prisma.userPlan.upsert({
      where: { userId },
      update: { stripeCustomerId: customerId },
      create: { userId, stripeCustomerId: customerId },
    });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    success_url: `${appUrl}/settings?tab=plans&success=true`,
    cancel_url: `${appUrl}/settings?tab=plans`,
    metadata: { clerkUserId: userId },
  });

  return NextResponse.json({ url: session.url });
}
