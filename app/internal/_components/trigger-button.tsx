"use client";

import { triggerDigest } from "@/app/actions/trigger-digest";
import { Button } from "@/components/ui/button";
import { useTransition } from "react";

export function TriggerButton({ newsletterId }: { newsletterId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={isPending}
      onClick={() => startTransition(() => triggerDigest(newsletterId))}
    >
      {isPending ? "Queued..." : "Run"}
    </Button>
  );
}
