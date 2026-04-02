"use client";

import { Check, Lock } from "lucide-react";
import { useState, useTransition } from "react";
import { subscribe, unsubscribe } from "@/app/actions/subscriptions";
import { Button } from "@/components/ui/button";

type Props = {
  newsletterId: string;
  subscriptionId: string | null;
  className?: string;
};

export function SubscribeButton({
  newsletterId,
  subscriptionId,
  className,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [limitHit, setLimitHit] = useState(false);
  const isSubscribed = subscriptionId !== null;

  function handleClick() {
    startTransition(async () => {
      if (isSubscribed && subscriptionId) {
        await unsubscribe(subscriptionId);
        setLimitHit(false);
      } else {
        const result = await subscribe(newsletterId);
        if (result.error) {
          setLimitHit(true);
        }
      }
    });
  }

  return (
    <div>
      <Button
        variant={isSubscribed ? "secondary" : "default"}
        size="sm"
        onClick={handleClick}
        disabled={isPending}
        className={
          isSubscribed
            ? `rounded-full bg-secondary text-foreground hover:bg-secondary/60 border border-border text-xs uppercase tracking-wider min-w-[110px] transition-colors ${className ?? ""}`
            : `rounded-full text-xs uppercase tracking-wider min-w-[110px] hover:opacity-80 transition-opacity ${className ?? ""}`
        }
      >
        {isPending ? (
          "..."
        ) : isSubscribed ? (
          <>
            <Check className="h-3.5 w-3.5" />
            Subscribed
          </>
        ) : (
          "Subscribe"
        )}
      </Button>

      {limitHit && (
        <div className="mt-2 border border-border bg-secondary/50 p-3 max-w-xs">
          <div className="flex items-start gap-2">
            <Lock className="h-3.5 w-3.5 shrink-0 text-foreground mt-0.5" />
            <div>
              <p className="text-xs font-medium text-foreground">
                Free plan limit reached
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                You&apos;ve reached the maximum number of subscriptions for your
                plan.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
