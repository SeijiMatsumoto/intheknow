"use client";

import { subscribe, unsubscribe } from "@/app/actions/subscriptions";
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
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={
        isSubscribed
          ? "rounded border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 hover:border-red-300 hover:text-red-600 disabled:opacity-50"
          : "rounded bg-black px-3 py-1.5 text-sm text-white hover:bg-zinc-800 disabled:opacity-50"
      }
    >
      {isPending ? "..." : isSubscribed ? "Subscribed" : "Subscribe"}
    </button>
  );
}
