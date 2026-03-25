"use client";

import { Check, Lock } from "lucide-react";
import Link from "next/link";
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
            ? `bg-secondary text-foreground hover:bg-secondary/80 border border-border min-w-[110px] ${className ?? ""}`
            : `min-w-[110px] ${className ?? ""}`
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
                Upgrade to Pro for unlimited subscriptions.
              </p>
              <Link
                href="/settings"
                className="mt-1.5 inline-block text-xs font-semibold text-foreground hover:underline"
              >
                Upgrade →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
