"use client";

import { useTransition } from "react";
import { setPlanOverride } from "@/app/actions/admin";
import type { Plan } from "@/lib/user";
import { cn } from "@/lib/utils";

const PLANS: { id: Plan; label: string }[] = [
  { id: "free", label: "Free" },
  { id: "plus", label: "Plus" },
  { id: "pro", label: "Pro" },
  { id: "admin", label: "Admin" },
];

export function AdminToolbar({ activePlan }: { activePlan: Plan }) {
  const [pending, startTransition] = useTransition();

  function handleSwitch(plan: Plan) {
    startTransition(() => setPlanOverride(plan));
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 rounded-full border border-border bg-card/95 backdrop-blur px-2 py-1.5 shadow-lg">
      <span className="text-[10px] font-medium text-muted-foreground px-2 uppercase tracking-wider">
        View as
      </span>
      {PLANS.map((p) => (
        <button
          key={p.id}
          type="button"
          disabled={pending}
          onClick={() => handleSwitch(p.id)}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium transition-colors",
            activePlan === p.id
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground hover:bg-foreground/10",
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
