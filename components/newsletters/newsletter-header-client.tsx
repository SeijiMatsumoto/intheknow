"use client";

import Link from "next/link";
import { ProfileButton } from "@/components/layout/profile-button";
import { SignInModalButton } from "@/components/layout/sign-in-button";

type Props = {
  userId: string | null;
  admin: boolean;
  hideProfile?: boolean;
};

export function NewsletterHeaderClient({ userId, admin, hideProfile }: Props) {
  return (
    <header className="hidden sm:block border-b border-border bg-background sticky top-0 z-50">
      <div className="mx-auto max-w-6xl px-6 py-4">
        <div className="flex items-center justify-between">
          <Link
            href={userId ? "/newsletters" : "/"}
            className="flex items-center gap-2"
          >
            <span className="font-serif text-xl font-bold tracking-tight text-foreground">
              In The Know
            </span>
          </Link>

          <nav className="flex items-center gap-6">
            {userId ? (
              <>
                <Link
                  href="/digests"
                  className="hidden sm:block text-xs font-medium uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                >
                  My Digests
                </Link>
                <Link
                  href="/newsletters"
                  className="hidden sm:block text-xs font-medium uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                >
                  Explore
                </Link>
                {admin && (
                  <Link
                    href="/internal"
                    className="hidden sm:block text-xs font-medium uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Internal
                  </Link>
                )}
                {!hideProfile && <ProfileButton />}
              </>
            ) : (
              <SignInModalButton />
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
