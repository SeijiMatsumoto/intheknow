import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">The Latest</h1>
        <p className="max-w-sm text-zinc-500">
          AI-powered digests on the topics you care about, delivered on your
          schedule.
        </p>
      </div>

      <SignedOut>
        <SignInButton mode="modal">
          <button
            type="button"
            className="rounded-md bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Sign in
          </button>
        </SignInButton>
      </SignedOut>

      <SignedIn>
        <Link
          href="/newsletters"
          className="rounded-md bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Browse newsletters →
        </Link>
      </SignedIn>
    </main>
  );
}
