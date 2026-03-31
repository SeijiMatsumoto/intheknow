"use client";

import {
  Briefcase,
  Check,
  Cpu,
  DollarSign,
  FlaskConical,
  Gamepad2,
  Globe,
  Newspaper,
  Trash2,
  Trophy,
} from "lucide-react";
import { useState, useTransition } from "react";
import { unsubscribe } from "@/app/actions/subscriptions";
import { Button } from "@/components/ui/button";
import {
  formatNextRun,
  formatScheduleLabel,
  toLocalDays,
} from "@/lib/format-schedule";
import type { Frequency } from "@/lib/frequency";
import { cn } from "@/lib/utils";

const PRICE_IDS: Record<string, { monthly: string; annual: string }> = {
  plus: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_PLUS_MONTHLY_PRICE_ID ?? "",
    annual: process.env.NEXT_PUBLIC_STRIPE_PLUS_ANNUAL_PRICE_ID ?? "",
  },
  pro: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID ?? "",
    annual: process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID ?? "",
  },
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  "ai-tech": Cpu,
  finance: DollarSign,
  politics: Globe,
  gaming: Gamepad2,
  sports: Trophy,
  science: FlaskConical,
  business: Briefcase,
};

function CategoryIcon({
  categoryId,
  className,
}: {
  categoryId: string | null;
  className?: string;
}) {
  const Icon = (categoryId && CATEGORY_ICONS[categoryId]) || Newspaper;
  return <Icon className={className} />;
}

const PLAN_CARDS = [
  {
    id: "free" as const,
    name: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      "3 newsletter subscriptions",
      "Full digest emails",
      "Browse all digests on the web",
    ],
  },
  {
    id: "plus" as const,
    name: "Plus",
    monthlyPrice: 8,
    annualPrice: 5,
    features: [
      "10 newsletter subscriptions",
      "Full digest with analysis",
      "Custom schedule",
      "3 custom newsletters",
    ],
  },
  {
    id: "pro" as const,
    name: "Pro",
    monthlyPrice: 20,
    annualPrice: 15,
    features: [
      "20 newsletter subscriptions",
      "Full digest with deep research",
      "Social consensus section",
      "10 custom newsletters",
      "Daily custom newsletter cadence",
    ],
  },
];

export type SubscriptionData = {
  id: string;
  newsletterId: string;
  newsletterTitle: string;
  newsletterSlug: string;
  newsletterCategoryId: string | null;
  frequency: Frequency;
  scheduleDays: string[];
  scheduleHour: number;
  nextRunIso: string;
  createdAt: string;
};

export function PlansSection({
  plan,
  subscriptions,
}: {
  plan: "free" | "plus" | "pro" | "admin";
  subscriptions: SubscriptionData[];
}) {
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [annual, setAnnual] = useState(true);
  const [loading, setLoading] = useState<string | null>(null);

  async function handleUpgrade(planId: "plus" | "pro") {
    const priceId = annual
      ? PRICE_IDS[planId].annual
      : PRICE_IDS[planId].monthly;
    if (!priceId) return;
    setLoading(planId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading(null);
    }
  }

  async function handleManage() {
    setLoading("manage");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading(null);
    }
  }

  function handleUnsubscribe(subscriptionId: string) {
    setRemovingId(subscriptionId);
    startTransition(async () => {
      await unsubscribe(subscriptionId);
      setRemovingId(null);
    });
  }

  return (
    <>
      {/* Billing toggle */}
      <div className="flex items-center gap-3 mb-4">
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
          className="relative h-5 w-9 rounded-full bg-foreground/15 transition-colors"
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-foreground transition-transform ${
              annual ? "left-[18px]" : "left-0.5"
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

      {/* Plan cards */}
      <div className="grid grid-cols-3 gap-3">
        {PLAN_CARDS.map((p) => {
          const isCurrent =
            p.id === plan || (p.id === "pro" && plan === "admin");
          const price = annual ? p.annualPrice : p.monthlyPrice;
          const isPaid = plan === "plus" || plan === "pro" || plan === "admin";

          return (
            <div
              key={p.id}
              className={cn(
                "rounded-xl border p-4 flex flex-col",
                isCurrent
                  ? "border-foreground bg-card"
                  : "border-border bg-card",
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-foreground">
                  {p.name}
                </p>
                {isCurrent && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-foreground bg-foreground/10 rounded-full px-2 py-0.5">
                    Current
                  </span>
                )}
              </div>
              <div className="mb-4">
                <span className="text-2xl font-bold text-foreground">
                  ${price}
                </span>
                <span className="text-xs text-muted-foreground">/mo</span>
                {annual && price > 0 && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    ${price * 12}/yr billed annually
                  </p>
                )}
              </div>
              <ul className="space-y-2 flex-1">
                {p.features.map((f) => (
                  <li
                    key={f}
                    className="flex gap-2 text-xs text-muted-foreground"
                  >
                    <Check className="h-3.5 w-3.5 text-foreground shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              {!isCurrent && p.id !== "free" && (
                <Button
                  variant={p.id === "plus" ? "default" : "outline"}
                  size="sm"
                  className="w-full mt-4"
                  disabled
                >
                  Coming soon
                </Button>
              )}
              {isCurrent && isPaid && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-4"
                  disabled
                >
                  Manage subscription
                </Button>
              )}
              {!isCurrent && p.id === "free" && isPaid && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-4"
                  disabled
                >
                  {loading === "manage" ? "Redirecting…" : "Downgrade"}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Active subscriptions */}
      <div className="border-t border-border pt-5 mt-1 space-y-1">
        <p className="text-sm font-medium text-foreground mb-3">
          Active subscriptions
        </p>
        {subscriptions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            No subscriptions yet.{" "}
            <a href="/newsletters" className="text-accent hover:underline">
              Browse newsletters
            </a>
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {subscriptions.map((sub) => {
              const nextRun = new Date(sub.nextRunIso);
              const localDays = toLocalDays(sub.scheduleDays, nextRun);
              const scheduleLabel = formatScheduleLabel(localDays, nextRun);
              const nextRunLabel = formatNextRun(nextRun);

              return (
                <li
                  key={sub.id}
                  className="flex items-center justify-between py-3 gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                      <CategoryIcon
                        categoryId={sub.newsletterCategoryId}
                        className="h-4 w-4"
                      />
                    </div>
                    <div className="min-w-0">
                      <a
                        href={`/newsletters/${sub.newsletterSlug}`}
                        className="text-sm font-medium text-foreground truncate block hover:underline underline-offset-2"
                      >
                        {sub.newsletterTitle}
                      </a>
                      <p className="text-xs text-muted-foreground">
                        {scheduleLabel}
                        <span className="mx-1.5 inline-block h-0.5 w-0.5 rounded-full bg-muted-foreground/50 align-middle" />
                        Next: {nextRunLabel}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={removingId === sub.id}
                    onClick={() => handleUnsubscribe(sub.id)}
                    className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {removingId === sub.id ? "Removing…" : "Remove"}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
