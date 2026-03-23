import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { SignInModalButton } from "@/components/sign-in-button";

export function CTA() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-20 sm:py-28 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
          Stop doomscrolling. Start knowing.
        </h2>
        <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
          Join for free and get your first digest tomorrow morning.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <SignInModalButton />
          <Link
            href="/newsletters"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Browse newsletters
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
