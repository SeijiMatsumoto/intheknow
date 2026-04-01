"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CATEGORIES } from "@/lib/categories";
import {
  completeOnboarding,
  getNewslettersByCategories,
} from "@/app/actions/onboarding";

type RecommendedNewsletter = {
  id: string;
  title: string;
  description: string | null;
  frequency: string;
  categoryId: string;
};

export function OnboardingClient() {
  const { isLoaded, user } = useUser();
  const router = useRouter();
  const initialized = useRef(false);

  const [step, setStep] = useState<
    "name" | "interests" | "loading" | "newsletters"
  >("name");
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set(),
  );
  const [newsletters, setNewsletters] = useState<RecommendedNewsletter[]>([]);
  const [selectedNewsletters, setSelectedNewsletters] = useState<Set<string>>(
    new Set(),
  );
  const [maxSubscriptions, setMaxSubscriptions] = useState(3);
  const [isPending, startTransition] = useTransition();

  // Pre-fill name from Clerk once loaded
  useEffect(() => {
    if (isLoaded && user && !initialized.current) {
      initialized.current = true;
      if (user.firstName) setFirstName(user.firstName);
      if (user.lastName) setLastName(user.lastName);
    }
  }, [isLoaded, user]);

  if (!isLoaded) return null;

  const hasName = !!(user?.firstName || user?.lastName);

  function handleNameContinue() {
    setStep("interests");
  }

  function toggleCategory(id: string) {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleInterestsContinue() {
    if (selectedCategories.size === 0) return;
    setStep("loading");
    setLoadingProgress(0);

    // Start fetching immediately
    const fetchPromise = getNewslettersByCategories([...selectedCategories]);

    // Animate progress bar over ~2.5s
    const start = Date.now();
    const duration = 2500;
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 0.9);
      setLoadingProgress(progress);
      if (progress < 0.9) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    const { newsletters: results, maxSubscriptions: max } = await fetchPromise;
    setNewsletters(results);
    setMaxSubscriptions(max);
    setSelectedNewsletters(new Set());

    // Fill to 100% then show results
    setLoadingProgress(1);
    await new Promise((r) => setTimeout(r, 400));
    setStep("newsletters");
  }

  function toggleNewsletter(id: string) {
    setSelectedNewsletters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < maxSubscriptions) {
        next.add(id);
      }
      return next;
    });
  }

  const atLimit = selectedNewsletters.size >= maxSubscriptions;

  function handleFinish() {
    startTransition(async () => {
      await completeOnboarding({
        firstName,
        lastName,
        newsletterIds: [...selectedNewsletters],
      });
    });
  }

  function handleSkip() {
    router.push("/newsletters");
  }

  return (
    <div className={`flex min-h-screen px-4 py-12 ${step === "newsletters" ? "items-start justify-center pt-16" : "items-center justify-center"}`}>
      <div className={`w-full ${step === "newsletters" ? "max-w-3xl" : "max-w-lg"} transition-all`}>
        <div className="text-center mb-8">
          <Link href="/">
            <span className="font-serif text-2xl font-bold tracking-tight text-foreground">
              In The Know
            </span>
          </Link>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {(["name", "interests", "newsletters"] as const).map((s, i) => {
            const stepIndex =
              step === "loading" ? 1.5 : ["name", "interests", "newsletters"].indexOf(step);
            const isActive = s === step || (step === "loading" && s === "interests");
            const isPast = stepIndex > i && !isActive;
            return (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`h-2 w-2 rounded-full transition-colors ${
                    isActive
                      ? "bg-foreground"
                      : isPast
                        ? "bg-foreground/40"
                        : "bg-muted-foreground/30"
                  }`}
                />
                {i < 2 && <div className="h-px w-8 bg-border" />}
              </div>
            );
          })}
        </div>

        {/* Step 1: Name */}
        {step === "name" && (
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold text-foreground text-center">
              {hasName ? `Welcome, ${user?.firstName}!` : "Welcome!"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground text-center mb-6">
              {hasName
                ? "Confirm your name or update it below."
                : "What should we call you?"}
            </p>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/50 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/50 focus:outline-none"
              />
              <Button
                type="button"
                size="lg"
                className="w-full gap-2"
                onClick={handleNameContinue}
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Interests */}
        {step === "interests" && (
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold text-foreground text-center">
              What are you interested in?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground text-center mb-6">
              Pick a few topics and we&apos;ll recommend newsletters for you.
            </p>

            <div className="flex flex-wrap gap-2 justify-center">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const selected = selectedCategories.has(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-all ${
                      selected
                        ? `${cat.pill} border-current`
                        : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {cat.label}
                    {selected && <Check className="h-3 w-3" />}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 space-y-2">
              <Button
                type="button"
                size="lg"
                className="w-full gap-2"
                disabled={selectedCategories.size === 0}
                onClick={handleInterestsContinue}
              >
                See recommendations
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Loading transition */}
        {step === "loading" && (
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex flex-col items-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mb-4" />
              <p className="text-sm font-medium text-foreground">
                Finding recommendations for you
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Matching newsletters to your interests...
              </p>
              <div className="mt-6 w-full max-w-xs">
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-foreground transition-all duration-200 ease-out"
                    style={{ width: `${Math.round(loadingProgress * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Recommended newsletters */}
        {step === "newsletters" && (
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold text-foreground text-center">
              Recommended for you
            </h2>
            <p className="mt-1 text-sm text-muted-foreground text-center mb-1">
              Pick the newsletters you want to subscribe to.
            </p>
            <p className="text-xs text-muted-foreground text-center mb-6">
              {selectedNewsletters.size} / {maxSubscriptions} selected
              {atLimit && " (limit reached)"}
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              {newsletters.map((nl) => {
                const selected = selectedNewsletters.has(nl.id);
                const disabled = !selected && atLimit;
                const cat = CATEGORIES.find((c) => c.id === nl.categoryId);
                return (
                  <button
                    key={nl.id}
                    type="button"
                    onClick={() => toggleNewsletter(nl.id)}
                    disabled={disabled}
                    className={`flex items-start gap-3 rounded-lg border p-4 text-left transition-all ${
                      selected
                        ? "border-foreground/20 bg-foreground/5"
                        : disabled
                          ? "border-border opacity-40 cursor-not-allowed"
                          : "border-border hover:border-foreground/10"
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                        selected
                          ? "border-foreground bg-foreground text-background"
                          : "border-muted-foreground/40"
                      }`}
                    >
                      {selected && <Check className="h-3 w-3" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-medium text-foreground">
                        {nl.title}
                      </span>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground capitalize">
                          {nl.frequency}
                        </span>
                        {cat && (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] ${cat.pill}`}
                          >
                            {cat.label}
                          </span>
                        )}
                      </div>
                      {nl.description && (
                        <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
                          {nl.description}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 space-y-2">
              <Button
                type="button"
                size="lg"
                className="w-full gap-2"
                disabled={isPending}
                onClick={handleFinish}
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    Get started
                    {selectedNewsletters.size > 0 &&
                      ` with ${selectedNewsletters.size} newsletter${selectedNewsletters.size === 1 ? "" : "s"}`}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Skip link */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={handleSkip}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
