import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe-token";

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ uid?: string; nid?: string; token?: string }>;
}) {
  const { uid, nid, token } = await searchParams;

  if (!uid || !nid || !token) {
    return (
      <Message
        title="Invalid link"
        body="This unsubscribe link is missing required parameters."
      />
    );
  }

  if (!verifyUnsubscribeToken(uid, nid, token)) {
    return (
      <Message
        title="Invalid link"
        body="This unsubscribe link is invalid or has been tampered with."
      />
    );
  }

  const subscription = await prisma.subscription.findFirst({
    where: { userId: uid, newsletterId: nid },
    include: { newsletter: { select: { title: true } } },
  });

  if (!subscription) {
    return (
      <Message
        title="Already unsubscribed"
        body="You're not subscribed to this newsletter."
      />
    );
  }

  await prisma.subscription.delete({ where: { id: subscription.id } });

  return (
    <Message
      title="Unsubscribed"
      body={`You've been unsubscribed from "${subscription.newsletter.title}". You won't receive any more emails from this newsletter.`}
    />
  );
}

function Message({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="mb-3 text-xl font-semibold text-foreground">{title}</h1>
        <p className="mb-6 text-sm text-muted-foreground">{body}</p>
        <Link
          href="/"
          className="text-sm font-medium text-accent hover:underline"
        >
          Go to The Latest
        </Link>
      </div>
    </div>
  );
}
