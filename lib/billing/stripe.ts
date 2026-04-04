import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

/**
 * Map Stripe price IDs to plan names.
 * Set these env vars to the price IDs from your Stripe dashboard.
 */
export function priceIdToPlan(priceId: string): "plus" | "pro" | null {
  if (
    priceId === process.env.STRIPE_PLUS_MONTHLY_PRICE_ID ||
    priceId === process.env.STRIPE_PLUS_ANNUAL_PRICE_ID
  ) {
    return "plus";
  }
  if (
    priceId === process.env.STRIPE_PRO_MONTHLY_PRICE_ID ||
    priceId === process.env.STRIPE_PRO_ANNUAL_PRICE_ID
  ) {
    return "pro";
  }
  return null;
}
