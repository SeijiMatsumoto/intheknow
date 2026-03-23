"use client";

import { SignInButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function SignInModalButton() {
  const { isSignedIn } = useAuth();

  if (isSignedIn) {
    return (
      <Button asChild>
        <Link href="/feed">Go to feed</Link>
      </Button>
    );
  }

  return (
    <SignInButton mode="modal" forceRedirectUrl="/newsletters">
      <Button>Sign in</Button>
    </SignInButton>
  );
}
