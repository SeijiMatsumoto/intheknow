"use client";

import { Play, Sparkles, X, Zap } from "lucide-react";
import { useState, useTransition } from "react";
import { triggerDigest } from "@/app/actions/trigger-digest";
import type { Plan } from "@/lib/user";
import { cn } from "@/lib/utils";

const TIERS: {
  id: Plan;
  label: string;
  description: string;
  icon: typeof Zap;
}[] = [
  {
    id: "free",
    label: "Free",
    description: "Summary + takeaways only. No AI analysis, no consensus.",
    icon: Zap,
  },
  {
    id: "plus",
    label: "Plus",
    description: "Full AI analysis, quotes, and Bottom Line.",
    icon: Sparkles,
  },
  {
    id: "pro",
    label: "Pro",
    description: "Everything in Plus + social consensus + deep research.",
    icon: Play,
  },
];

export function TriggerButton({ newsletterId }: { newsletterId: string }) {
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<Plan>("pro");

  function handleRun() {
    setShowModal(false);
    startTransition(() => triggerDigest(newsletterId, selected));
  }

  return (
    <>
      <button
        type="button"
        disabled={isPending}
        onClick={() => setShowModal(true)}
        className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors disabled:opacity-40"
        title={isPending ? "Queued…" : "Run digest"}
      >
        <Play className="h-3.5 w-3.5" />
      </button>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                Generate digest
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              Choose which tier to generate. This determines the depth of
              content included in the digest.
            </p>

            <div className="space-y-2">
              {TIERS.map((tier) => {
                const Icon = tier.icon;
                return (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setSelected(tier.id)}
                    className={cn(
                      "w-full flex items-start gap-3 rounded-xl border p-3 text-left transition-colors",
                      selected === tier.id
                        ? "border-accent bg-accent/5"
                        : "border-border hover:border-muted-foreground/30",
                    )}
                  >
                    <div
                      className={cn(
                        "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                        selected === tier.id ? "bg-accent/10" : "bg-secondary",
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4",
                          selected === tier.id
                            ? "text-accent"
                            : "text-muted-foreground",
                        )}
                      />
                    </div>
                    <div>
                      <p
                        className={cn(
                          "text-sm font-medium",
                          selected === tier.id
                            ? "text-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        {tier.label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {tier.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRun}
                className="flex-1 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 transition-opacity"
              >
                Generate
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
