"use client";

import { SignInButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function SignInModalButton() {
  const { isSignedIn } = useAuth();

  if (isSignedIn) {
    return (
      <Link href="/digests">
        <Button>Go to digests</Button>
      </Link>
    );
  }

  return (
    <SignInButton mode="modal" forceRedirectUrl="/newsletters">
      <Button>Sign in</Button>
    </SignInButton>
  );
}
