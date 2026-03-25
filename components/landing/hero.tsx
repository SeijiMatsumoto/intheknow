import { ArrowRight, ChevronDown } from "lucide-react";
import Link from "next/link";
import { SignInModalButton } from "@/components/sign-in-button";

export function Hero() {
  const today = new Date();
  const dateStr = today
    .toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    .toUpperCase();

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6">
      {/* Masthead area */}
      <div className="pt-8 pb-6 text-center">
        <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-5">
          {dateStr}
        </p>
        <div className="border-t-[3px] border-foreground mb-3" />
        <div className="border-t border-foreground/30 mb-8" />

        <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-bold tracking-tight text-foreground leading-[1.05] text-balance">
          Stay ahead of
          <br />
          what matters
        </h1>

        <div className="mt-8 border-t border-foreground/30 mb-3" />
        <div className="border-t border-foreground/30" />
      </div>

      {/* Subhead + CTA in newspaper column style */}
      <div className="grid md:grid-cols-[1fr_auto] gap-8 md:gap-12 items-start pb-10">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3">
            AI-powered newsletter digests
          </p>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl">
            AI researches the web and social media for the topics you care about,
            then writes you a concise, opinionated digest — delivered on your
            schedule.
          </p>
        </div>
        <div className="flex flex-col items-start md:items-end gap-4 md:pt-6">
          <SignInModalButton />
          <Link
            href="/newsletters"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Browse newsletters first
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Ticker strip */}
      <div className="border-t-[3px] border-foreground" />
      <div className="py-2.5 overflow-hidden">
        <div className="flex w-max animate-marquee">
          {[0, 1].map((copy) => (
            <div
              key={copy}
              className="flex items-center gap-6 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground whitespace-nowrap pr-6"
            >
              <span>AI & Tech</span>
              <span className="text-foreground/20">◆</span>
              <span>Finance</span>
              <span className="text-foreground/20">◆</span>
              <span>Crypto</span>
              <span className="text-foreground/20">◆</span>
              <span>Politics</span>
              <span className="text-foreground/20">◆</span>
              <span>Science</span>
              <span className="text-foreground/20">◆</span>
              <span>Gaming</span>
              <span className="text-foreground/20">◆</span>
              <span>Sports</span>
              <span className="text-foreground/20">◆</span>
              <span>Culture</span>
              <span className="text-foreground/20">◆</span>
              <span>Health</span>
              <span className="text-foreground/20">◆</span>
              <span>Business</span>
              <span className="text-foreground/20">◆</span>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-foreground/30" />

      <div className="flex justify-center py-10">
        <a
          href="#how-it-works"
          className="text-muted-foreground/40 hover:text-muted-foreground transition-colors animate-bounce"
        >
          <ChevronDown className="h-5 w-5" />
        </a>
      </div>
    </section>
  );
}
