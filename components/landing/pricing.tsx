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
      "Full digest emails",
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
      "3 custom newsletters",
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
      "10 custom newsletters",
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
    <section id="pricing" className="bg-secondary/30">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-28">
        <div className="text-center mb-6">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Start free, upgrade when you&apos;re hooked
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Every plan includes AI-generated digests delivered to your inbox.
            Upgrade for deeper research, more subscriptions, and custom
            newsletters.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-3 mb-12">
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
            className="relative h-6 w-11 rounded-full bg-foreground/15 transition-colors"
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-foreground transition-transform ${
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
            <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-foreground/5 rounded-full px-2 py-0.5">
              Save 25%+
            </span>
          </button>
        </div>

        <div className="grid sm:grid-cols-3 gap-5">
          {PLANS.map((plan) => {
            const price = annual ? plan.annualPrice : plan.monthlyPrice;

            return (
              <div
                key={plan.name}
                className={`rounded-xl p-6 sm:p-8 flex flex-col relative ${
                  plan.highlighted
                    ? "bg-card border-2 border-foreground shadow-lg"
                    : "bg-card border border-border"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-6 bg-foreground text-background px-3 py-0.5 rounded-full text-xs font-semibold">
                    Popular
                  </div>
                )}
                <p className="text-sm font-medium text-muted-foreground">
                  {plan.name}
                </p>
                <div className="mt-3 mb-6">
                  <span className="text-4xl font-bold text-foreground">
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
                <div className="border-t border-border pt-6 mb-6 flex-1">
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    {plan.features.map((f) => (
                      <li key={f} className="flex gap-2.5">
                        <Check className="h-4 w-4 text-foreground shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>{plan.cta}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
