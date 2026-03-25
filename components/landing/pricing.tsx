"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import { SignInModalButton } from "@/components/sign-in-button";
import { Button } from "@/components/ui/button";

type PlanCard = {
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  highlighted?: boolean;
  cta: React.ReactNode;
};

const PLANS: PlanCard[] = [
  {
    name: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      "1 newsletter subscription",
      "Headline digest emails",
      "Browse all digests on the web",
    ],
    cta: <SignInModalButton />,
  },
  {
    name: "Plus",
    monthlyPrice: 8,
    annualPrice: 5,
    highlighted: true,
    features: [
      "10 newsletter subscriptions",
      "Full digest with analysis",
      "Custom schedule",
      "2 custom newsletters",
    ],
    cta: <Button className="w-full">Get Plus</Button>,
  },
  {
    name: "Pro",
    monthlyPrice: 20,
    annualPrice: 15,
    features: [
      "Unlimited subscriptions",
      "Full digest with deep research",
      "Social consensus section",
      "5 custom newsletters",
      "Daily custom newsletter cadence",
    ],
    cta: (
      <Button variant="outline" className="w-full">
        Get Pro
      </Button>
    ),
  },
];

export function Pricing() {
  const [annual, setAnnual] = useState(true);

  return (
    <section id="pricing" className="border-t border-border">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-20 sm:py-28">
        <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase mb-3">
          Pricing
        </p>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground mb-4">
          Start free, upgrade when you&apos;re hooked
        </h2>
        <p className="text-muted-foreground max-w-xl mb-10">
          Every plan includes AI-generated digests delivered to your inbox.
          Upgrade for deeper research, more subscriptions, and custom
          newsletters.
        </p>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-3 mb-14">
          <button
            type="button"
            onClick={() => setAnnual(false)}
            className={`text-sm font-medium transition-colors ${
              !annual ? "text-foreground" : "text-muted-foreground/60"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setAnnual(!annual)}
            className="relative h-6 w-11 rounded-full border border-border bg-secondary transition-colors"
          >
            <span
              className={`absolute top-0.5 h-4.5 w-4.5 rounded-full bg-foreground transition-transform ${
                annual ? "left-[22px]" : "left-0.5"
              }`}
            />
          </button>
          <button
            type="button"
            onClick={() => setAnnual(true)}
            className={`text-sm font-medium transition-colors ${
              annual ? "text-foreground" : "text-muted-foreground/60"
            }`}
          >
            Annual
            <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border border-border px-1.5 py-0.5">
              Save 25%+
            </span>
          </button>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
          {PLANS.map((plan) => {
            const price = annual ? plan.annualPrice : plan.monthlyPrice;

            return (
              <div
                key={plan.name}
                className={`p-6 flex flex-col relative ${
                  plan.highlighted
                    ? "border-2 border-foreground bg-card"
                    : "border border-border bg-card"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-foreground px-3 py-0.5 text-xs font-semibold text-background">
                    Popular
                  </div>
                )}
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {plan.name}
                </p>
                <div className="mt-3 mb-5">
                  <span className="font-serif text-3xl font-bold text-foreground">
                    ${price}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    /month
                  </span>
                  {annual && price > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground/60">
                      ${price * 12}/year
                    </p>
                  )}
                </div>
                <ul className="space-y-2.5 text-sm text-muted-foreground flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <Check className="h-4 w-4 text-foreground shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-6">{plan.cta}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
