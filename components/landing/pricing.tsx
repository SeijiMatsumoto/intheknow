import { Check } from "lucide-react";
import { SignInModalButton } from "@/components/sign-in-button";
import { Button } from "@/components/ui/button";

type PlanCard = {
  name: string;
  price: string;
  features: string[];
  highlighted?: boolean;
  cta: React.ReactNode;
};

const PLANS: PlanCard[] = [
  {
    name: "Free",
    price: "$0",
    features: [
      "1 newsletter subscription",
      "Headline digest emails",
      "Browse all digests on the web",
    ],
    cta: <SignInModalButton />,
  },
  {
    name: "Plus",
    price: "$8",
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
    price: "$20",
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
  return (
    <section id="pricing" className="border-t border-border">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-20 sm:py-28">
        <p className="text-xs font-bold tracking-widest text-accent uppercase mb-3">
          Pricing
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
          Start free, upgrade when you&apos;re hooked
        </h2>
        <p className="text-muted-foreground max-w-xl mb-14">
          Every plan includes AI-generated digests delivered to your inbox.
          Upgrade for deeper research, more subscriptions, and custom
          newsletters.
        </p>

        <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl p-6 flex flex-col relative ${
                plan.highlighted
                  ? "border-2 border-accent bg-card"
                  : "border border-border bg-card"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-0.5 text-xs font-semibold text-accent-foreground">
                  Popular
                </div>
              )}
              <p className="text-sm font-semibold text-foreground">
                {plan.name}
              </p>
              <div className="mt-3 mb-5">
                <span className="text-3xl font-bold text-foreground">
                  {plan.price}
                </span>
                <span className="text-sm text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-2.5 text-sm text-muted-foreground flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-6">{plan.cta}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
