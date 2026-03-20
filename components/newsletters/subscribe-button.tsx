"use client";

import { Check } from "lucide-react";
import { useTransition } from "react";
import { subscribe, unsubscribe } from "@/app/actions/subscriptions";
import { Button } from "@/components/ui/button";

interface Props {
  newsletterId: string;
  subscriptionId: string | null;
}

export function SubscribeButton({ newsletterId, subscriptionId }: Props) {
  const [isPending, startTransition] = useTransition();
  const isSubscribed = subscriptionId !== null;

  function handleClick() {
    startTransition(async () => {
      if (isSubscribed && subscriptionId) {
        await unsubscribe(subscriptionId);
      } else {
        await subscribe(newsletterId);
      }
    });
  }

  return (
    <Button
      variant={isSubscribed ? "secondary" : "default"}
      size="sm"
      onClick={handleClick}
      disabled={isPending}
      className={
        isSubscribed
          ? "bg-accent/20 text-accent hover:bg-accent/30 border border-accent/30 min-w-[110px]"
          : "min-w-[110px]"
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
  );
}
