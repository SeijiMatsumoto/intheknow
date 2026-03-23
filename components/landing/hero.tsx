import { ArrowRight, ChevronDown, Zap } from "lucide-react";
import Link from "next/link";
import { SignInModalButton } from "@/components/sign-in-button";

export function Hero() {
  return (
    <section className="mx-auto max-w-5xl px-4 sm:px-6">
      <div className="flex min-h-[calc(100vh-65px)] flex-col items-center justify-center text-center py-16">
        <div className="mb-6 flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-sm text-accent">
          <Zap className="h-3.5 w-3.5" />
          AI-powered newsletter digests
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground text-balance">
          Stay ahead of{" "}
          <span className="text-accent">what matters</span>
        </h1>

        <p className="mt-6 max-w-2xl text-base sm:text-lg text-muted-foreground text-pretty">
          AI researches the web and social media for the topics you care about,
          then writes you a concise, opinionated digest — delivered on your schedule.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <SignInModalButton />
          <Link
            href="/newsletters"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Browse newsletters first
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <a
          href="#how-it-works"
          className="mt-16 text-muted-foreground/50 hover:text-muted-foreground transition-colors animate-bounce"
        >
          <ChevronDown className="h-5 w-5" />
        </a>
      </div>
    </section>
  );
}
