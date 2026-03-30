"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import {
  Briefcase,
  Cpu,
  CreditCard,
  DollarSign,
  FlaskConical,
  Gamepad2,
  Globe,
  LogOut,
  Moon,
  Newspaper,
  Palette,
  Save,
  Shield,
  Sun,
  Trash2,
  Trophy,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useState, useTransition } from "react";
import { unsubscribe } from "@/app/actions/subscriptions";
import type { Frequency } from "@/lib/frequency";
import {
  formatNextRun,
  formatScheduleLabel,
  toLocalDays,
} from "@/lib/format-schedule";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Section = "profile" | "appearance" | "account" | "plans";

const NAV = [
  { id: "profile" as Section, label: "Profile", icon: User },
  { id: "plans" as Section, label: "Plans", icon: CreditCard },
  { id: "appearance" as Section, label: "Appearance", icon: Palette },
  { id: "account" as Section, label: "Account", icon: Shield },
];

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

type SubscriptionData = {
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

export function SettingsClient({
  subscriptions,
  plan,
}: {
  subscriptions: SubscriptionData[];
  plan: "free" | "plus" | "pro" | "admin";
}) {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const [active, setActive] = useState<Section>("profile");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  if (
    isLoaded &&
    user &&
    firstName === "" &&
    lastName === "" &&
    (user.firstName || user.lastName)
  ) {
    setFirstName(user.firstName ?? "");
    setLastName(user.lastName ?? "");
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    await user.update({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleUnsubscribe(subscriptionId: string) {
    setRemovingId(subscriptionId);
    startTransition(async () => {
      await unsubscribe(subscriptionId);
      setRemovingId(null);
    });
  }

  const initials =
    [user?.firstName, user?.lastName]
      .filter((n): n is string => Boolean(n))
      .map((n) => n[0])
      .join("")
      .toUpperCase() ||
    user?.emailAddresses[0]?.emailAddress[0]?.toUpperCase() ||
    "?";

  /* ── shared section content ── */
  const profileContent = (
    <>
      <div className="flex items-center gap-4">
        {user?.imageUrl ? (
          <img
            src={user.imageUrl}
            alt={initials}
            width={56}
            height={56}
            referrerPolicy="no-referrer"
            className="h-14 w-14 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/20 text-lg font-semibold text-accent">
            {initials}
          </div>
        )}
        <div>
          <p className="font-medium text-foreground">{user?.fullName || "—"}</p>
          <p className="text-sm text-muted-foreground">
            {user?.emailAddresses[0]?.emailAddress}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label
            htmlFor="firstName"
            className="text-sm font-medium text-foreground"
          >
            First name
          </label>
          <input
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
          />
        </div>
        <div className="space-y-1.5">
          <label
            htmlFor="lastName"
            className="text-sm font-medium text-foreground"
          >
            Last name
          </label>
          <input
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          Email
        </label>
        <input
          id="email"
          value={user?.emailAddresses[0]?.emailAddress ?? ""}
          disabled
          className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
        />
        <p className="text-xs text-muted-foreground">
          Email cannot be changed here.
        </p>
      </div>
      <Button onClick={handleSave} disabled={saving} size="sm">
        <Save className="h-3.5 w-3.5" />
        {saved ? "Saved!" : saving ? "Saving…" : "Save changes"}
      </Button>
    </>
  );

  const plansContent = (
    <>
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold",
            plan === "admin"
              ? "bg-rose-500/20 text-rose-500"
              : plan === "pro"
                ? "bg-accent/20 text-accent"
                : plan === "plus"
                  ? "bg-blue-500/20 text-blue-500"
                  : "bg-secondary text-muted-foreground",
          )}
        >
          {plan === "admin"
            ? "Admin"
            : plan === "pro"
              ? "Pro"
              : plan === "plus"
                ? "Plus"
                : "Free"}
        </span>
        <p className="text-sm text-muted-foreground">
          {plan === "free"
            ? "Upgrade to unlock full digests, more subscriptions, and custom newsletters."
            : plan === "plus"
              ? "Upgrade to Pro for social consensus, deep research, and daily custom newsletters."
              : "You have access to all features."}
        </p>
      </div>
      <div className="border-t border-border pt-4 space-y-1">
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

  const appearanceContent = (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-foreground">Theme</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Switch between light and dark mode
        </p>
      </div>
      <button
        type="button"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
      >
        {theme === "dark" ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
        {theme === "dark" ? "Light" : "Dark"}
      </button>
    </div>
  );

  const accountContent = (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-foreground">Sign out</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Sign out on this device
        </p>
      </div>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => signOut(() => router.push("/"))}
      >
        <LogOut className="h-3.5 w-3.5" />
        Sign out
      </Button>
    </div>
  );

  /* ── mobile: stacked sections (no tabs) ── */
  const mobileLayout = (
    <div className="space-y-8">
      {[
        { label: "Profile", content: profileContent },
        { label: "Plans", content: plansContent },
        { label: "Appearance", content: appearanceContent },
        { label: "Account", content: accountContent },
      ].map(({ label, content }) => (
        <div key={label}>
          <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
            {content}
          </div>
        </div>
      ))}
    </div>
  );

  /* ── desktop: sidebar + active section ── */
  const desktopLayout = (
    <div className="flex gap-8">
      <nav className="w-48 shrink-0 space-y-1">
        {NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActive(id)}
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
        {active === "profile" && (
          <section className="rounded-2xl border border-border bg-card p-6 space-y-5">
            <h2 className="text-base font-semibold text-foreground">Profile</h2>
            {profileContent}
          </section>
        )}
        {active === "plans" && (
          <section className="rounded-2xl border border-border bg-card p-6 space-y-5">
            <h2 className="text-base font-semibold text-foreground">Plans</h2>
            {plansContent}
          </section>
        )}
        {active === "appearance" && (
          <section className="rounded-2xl border border-border bg-card p-6 space-y-5">
            <h2 className="text-base font-semibold text-foreground">
              Appearance
            </h2>
            {appearanceContent}
          </section>
        )}
        {active === "account" && (
          <section className="rounded-2xl border border-border bg-card p-6 space-y-5">
            <h2 className="text-base font-semibold text-foreground">Account</h2>
            {accountContent}
          </section>
        )}
      </div>
    </div>
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 pb-24 sm:px-6 sm:py-10 sm:pb-10">
      <PageHeader
        title="Settings"
        description="Manage your profile, plan, and preferences."
      />
      <div className="sm:hidden">{mobileLayout}</div>
      <div className="hidden sm:block">{desktopLayout}</div>
    </main>
  );
}
