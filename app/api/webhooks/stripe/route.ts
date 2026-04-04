import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { priceIdToPlan, stripe } from "@/lib/billing/stripe";

function getPeriodEnd(subscription: Stripe.Subscription): Date | null {
  const end = subscription.items.data[0]?.current_period_end;
  return end ? new Date(end * 1000) : null;
}

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== "subscription" || !session.subscription) break;

      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string,
      );
      const priceId = subscription.items.data[0]?.price.id;
      const plan = priceIdToPlan(priceId ?? "");
      const customer = await stripe.customers.retrieve(
        session.customer as string,
      );
      const clerkUserId =
        session.metadata?.clerkUserId ??
        (!customer.deleted ? customer.metadata?.clerkUserId : undefined);

      if (clerkUserId && plan) {
        await prisma.userPlan.upsert({
          where: { userId: clerkUserId },
          update: {
            plan,
            stripeSubscriptionId: subscription.id,
            stripePriceId: priceId,
            stripeCurrentPeriodEnd: getPeriodEnd(subscription),
          },
          create: {
            userId: clerkUserId,
            plan,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: subscription.id,
            stripePriceId: priceId,
            stripeCurrentPeriodEnd: getPeriodEnd(subscription),
          },
        });
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const priceId = subscription.items.data[0]?.price.id;
      const plan = priceIdToPlan(priceId ?? "");

      if (plan) {
        await prisma.userPlan.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            plan,
            stripePriceId: priceId,
            stripeCurrentPeriodEnd: getPeriodEnd(subscription),
          },
        });
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await prisma.userPlan.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          plan: "free",
          stripeSubscriptionId: null,
          stripePriceId: null,
          stripeCurrentPeriodEnd: null,
        },
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
