"use client";

import { SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export function SignInModalButton() {
  return (
    <SignInButton mode="modal" forceRedirectUrl="/newsletters">
      <Button>Sign in</Button>
    </SignInButton>
  );
}
