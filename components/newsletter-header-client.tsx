"use client";

import { Zap } from "lucide-react";
import Link from "next/link";
import { ProfileButton } from "@/components/profile-button";
import { SignInModalButton } from "@/components/sign-in-button";

interface Props {
  userId: string | null;
  admin: boolean;
  hideProfile?: boolean;
}

export function NewsletterHeaderClient({ userId, admin, hideProfile }: Props) {
  return (
    <header className="hidden sm:block border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto max-w-5xl px-6 py-4">
        <div className="flex items-center justify-between">
          <Link
            href={userId ? "/newsletters" : "/"}
            className="flex items-center gap-2"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
              <Zap className="h-4 w-4 text-accent-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground">ITK</span>
          </Link>

          <nav className="flex items-center gap-6">
            {userId ? (
              <>
                {/* Desktop-only nav links */}
                <Link
                  href="/newsletters"
                  className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Browse
                </Link>
                <Link
                  href="/feed"
                  className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  My Feed
                </Link>
                {admin && (
                  <Link
                    href="/internal"
                    className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors"
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
