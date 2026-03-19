"use client";

import { subscribe, unsubscribe } from "@/app/actions/subscriptions";
import { Button } from "@/components/ui/button";
import { useTransition } from "react";

interface Props {
  newsletterId: string;
  subscriptionId: string | null;
}

export function SubscribeButton({ newsletterId, subscriptionId }: Props) {
  const [isPending, startTransition] = useTransition();
  const isSubscribed = subscriptionId !== null;

  function handleClick() {
    startTransition(async () => {
      if (isSubscribed) {
        await unsubscribe(subscriptionId!);
      } else {
        await subscribe(newsletterId);
      }
    });
  }

  return (
    <Button
      variant={isSubscribed ? "outline" : "default"}
      size="sm"
      onClick={handleClick}
      disabled={isPending}
    >
      {isPending ? "..." : isSubscribed ? "Subscribed" : "Subscribe"}
    </Button>
  );
}
