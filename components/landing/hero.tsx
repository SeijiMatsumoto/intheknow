import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { SignInModalButton } from "@/components/layout/sign-in-button";

export function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="pt-20 sm:pt-28 pb-16 sm:pb-20 text-center">
        <p className="text-sm font-medium text-muted-foreground mb-6">
          AI-powered newsletter digests
        </p>

        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-foreground leading-[1.05] text-balance">
          Stay ahead of
          <br />
          what matters
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto text-balance">
          AI researches the web and social media for the topics you care about,
          then writes you a concise, opinionated digest — delivered on your
          schedule.
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

      {/* Ticker strip */}
      <div className="rounded-xl bg-secondary/50 py-3 overflow-hidden">
        <div className="flex w-max animate-marquee">
          {[0, 1].map((copy) => (
            <div
              key={copy}
              className="flex items-center gap-6 text-xs font-medium uppercase tracking-wider text-muted-foreground whitespace-nowrap pr-6"
            >
              <span>AI & Tech</span>
              <span className="text-muted-foreground/30">·</span>
              <span>Finance</span>
              <span className="text-muted-foreground/30">·</span>
              <span>Crypto</span>
              <span className="text-muted-foreground/30">·</span>
              <span>Politics</span>
              <span className="text-muted-foreground/30">·</span>
              <span>Science</span>
              <span className="text-muted-foreground/30">·</span>
              <span>Gaming</span>
              <span className="text-muted-foreground/30">·</span>
              <span>Sports</span>
              <span className="text-muted-foreground/30">·</span>
              <span>Culture</span>
              <span className="text-muted-foreground/30">·</span>
              <span>Health</span>
              <span className="text-muted-foreground/30">·</span>
              <span>Business</span>
              <span className="text-muted-foreground/30">·</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
