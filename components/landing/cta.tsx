import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { SignInModalButton } from "@/components/sign-in-button";

export function CTA() {
  return (
    <section className="bg-secondary/30">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-28">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground tracking-tight leading-tight">
            Stop doomscrolling.
            <br />
            Start knowing.
          </h2>
          <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
            Join for free and get your first digest tomorrow morning.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
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
      </div>
    </section>
  );
}
