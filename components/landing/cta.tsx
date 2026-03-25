import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { SignInModalButton } from "@/components/sign-in-button";

export function CTA() {
  return (
    <section>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
        <div className="border-t-[3px] border-foreground mb-3" />
        <div className="border-t border-foreground/30 mb-10" />
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-4">
            Get started
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-5 leading-tight">
            Stop doomscrolling.
            <br />
            Start knowing.
          </h2>
          <p className="text-muted-foreground mb-10 max-w-lg mx-auto">
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
        <div className="mt-10 border-t border-foreground/30 mb-3" />
        <div className="border-t-[3px] border-foreground" />
      </div>
    </section>
  );
}
