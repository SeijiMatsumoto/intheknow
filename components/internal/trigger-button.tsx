"use client";

import { triggerDigest } from "@/app/actions/trigger-digest";
import { Play } from "lucide-react";
import { useTransition } from "react";

export function TriggerButton({ newsletterId }: { newsletterId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => triggerDigest(newsletterId))}
      className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors disabled:opacity-40"
      title={isPending ? "Queued…" : "Run digest"}
    >
      <Play className="h-3.5 w-3.5" />
    </button>
  );
}
