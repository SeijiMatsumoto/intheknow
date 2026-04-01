"use client";

import { CreditCard, Palette, Shield, User } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { AccountSection } from "@/components/settings/account-section";
import { AppearanceSection } from "@/components/settings/appearance-section";
import {
  PlansSection,
  type SubscriptionData,
} from "@/components/settings/plans-section";
import { ProfileSection } from "@/components/settings/profile-section";
import { cn } from "@/lib/utils";

type Section = "profile" | "appearance" | "account" | "plans";

const NAV = [
  { id: "profile" as Section, label: "Profile", icon: User },
  { id: "plans" as Section, label: "Plans", icon: CreditCard },
  { id: "appearance" as Section, label: "Appearance", icon: Palette },
  { id: "account" as Section, label: "Account", icon: Shield },
];

const SECTIONS: { id: Section; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "plans", label: "Plans" },
  { id: "appearance", label: "Appearance" },
  { id: "account", label: "Account" },
];

export function SettingsClient({
  subscriptions,
  plan,
}: {
  subscriptions: SubscriptionData[];
  plan: "free" | "plus" | "pro" | "admin";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get("tab");
  const initialTab =
    tabParam && ["profile", "plans", "appearance", "account"].includes(tabParam)
      ? (tabParam as Section)
      : "profile";

  const [active, setActive] = useState<Section>(initialTab);

  const setActiveTab = useCallback(
    (tab: Section) => {
      setActive(tab);
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  function renderSection(id: Section) {
    switch (id) {
      case "profile":
        return <ProfileSection />;
      case "plans":
        return <PlansSection plan={plan} subscriptions={subscriptions} />;
      case "appearance":
        return <AppearanceSection />;
      case "account":
        return <AccountSection />;
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 pb-24 sm:px-6 sm:py-10 sm:pb-10">
      <PageHeader
        title="Settings"
        description="Manage your profile, plan, and preferences."
      />

      {/* Mobile: stacked sections */}
      <div className="sm:hidden space-y-8">
        {SECTIONS.map(({ id, label }) => (
          <div key={id}>
            <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
              {renderSection(id)}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: sidebar + active section */}
      <div className="hidden sm:flex gap-8">
        <nav className="w-48 shrink-0 space-y-1">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-left",
                active === id
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>
        <div className="flex-1 min-w-0">
          <section className="rounded-2xl border border-border bg-card p-6 space-y-5">
            <h2 className="text-base font-semibold text-foreground">
              {SECTIONS.find((s) => s.id === active)?.label}
            </h2>
            {renderSection(active)}
          </section>
        </div>
      </div>
    </main>
  );
}
