import { SignInModalButton } from "@/app/_components/sign-in-button";
import { Button } from "@/components/ui/button";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

export default async function Home() {
  const { userId } = await auth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">The Latest</h1>
        <p className="max-w-sm text-muted-foreground">
          AI-powered digests on the topics you care about, delivered on your
          schedule.
        </p>
      </div>

      {userId ? (
        <Button>
          <Link href="/newsletters">Browse newsletters →</Link>
        </Button>
      ) : (
        <SignInModalButton />
      )}
    </main>
  );
}
