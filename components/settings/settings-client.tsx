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
  frequency: string;
  scheduleDays: string[];
  scheduleHour: number;
  createdAt: string;
};

export function SettingsClient({
  subscriptions,
  plan,
}: {
  subscriptions: SubscriptionData[];
  plan: "free" | "pro" | "admin";
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

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight text-foreground mb-8">
        Settings
      </h1>

      <div className="flex gap-8">
        {/* Left nav */}
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

        {/* Right content */}
        <div className="flex-1 min-w-0">
          {/* Profile */}
          {active === "profile" && (
            <section className="rounded-2xl border border-border bg-card p-6 space-y-5">
              <h2 className="text-base font-semibold text-foreground">
                Profile
              </h2>

              <div className="flex items-center gap-4">
                {user?.imageUrl ? (
                  <img
                    src={user.imageUrl}
                    alt={initials}
                    referrerPolicy="no-referrer"
                    className="h-14 w-14 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/20 text-lg font-semibold text-accent">
                    {initials}
                  </div>
                )}
                <div>
                  <p className="font-medium text-foreground">
                    {user?.fullName || "—"}
                  </p>
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
                    className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
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
                    className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-foreground"
                >
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
            </section>
          )}

          {/* Plans */}
          {active === "plans" && (
            <div className="space-y-5">
              {/* Current plan */}
              <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
                <h2 className="text-base font-semibold text-foreground">
                  Current plan
                </h2>
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold",
                      plan === "admin"
                        ? "bg-rose-500/20 text-rose-500"
                        : plan === "pro"
                          ? "bg-accent/20 text-accent"
                          : "bg-secondary text-muted-foreground",
                    )}
                  >
                    {plan === "admin"
                      ? "Admin"
                      : plan === "pro"
                        ? "Pro"
                        : "Free"}
                  </span>
                  {plan === "free" && (
                    <p className="text-sm text-muted-foreground">
                      Upgrade to Pro to unlock custom newsletters, delivery
                      scheduling, and more.
                    </p>
                  )}
                  {(plan === "pro" || plan === "admin") && (
                    <p className="text-sm text-muted-foreground">
                      You have access to all Pro features.
                    </p>
                  )}
                </div>
              </section>

              {/* Subscriptions */}
              <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
                <h2 className="text-base font-semibold text-foreground">
                  Active subscriptions
                </h2>

                {subscriptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">
                    You haven't subscribed to any newsletters yet.{" "}
                    <a
                      href="/newsletters"
                      className="text-accent hover:underline"
                    >
                      Browse newsletters
                    </a>
                  </p>
                ) : (
                  <ul className="divide-y divide-border">
                    {subscriptions.map((sub) => (
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
                            <p className="text-sm font-medium text-foreground truncate">
                              {sub.newsletterTitle}
                            </p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {sub.frequency}
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
                          {removingId === sub.id ? "Removing…" : "Unsubscribe"}
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )}

          {/* Appearance */}
          {active === "appearance" && (
            <section className="rounded-2xl border border-border bg-card p-6 space-y-5">
              <h2 className="text-base font-semibold text-foreground">
                Appearance
              </h2>

              <div className="flex items-center justify-between py-2">
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
                  {theme === "dark" ? "Switch to light" : "Switch to dark"}
                </button>
              </div>
            </section>
          )}

          {/* Account */}
          {active === "account" && (
            <section className="rounded-2xl border border-border bg-card p-6 space-y-5">
              <h2 className="text-base font-semibold text-foreground">
                Account
              </h2>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Sign out
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Sign out of your account on this device
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
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
