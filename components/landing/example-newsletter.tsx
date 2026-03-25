import { MessageCircle } from "lucide-react";

export function ExampleNewsletter() {
  return (
    <section className="bg-foreground text-background">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
        <div className="grid md:grid-cols-[1fr_1fr] gap-12 md:gap-16 items-start">
          {/* Left: copy */}
          <div>
            <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-background/50 mb-3">
              What you get
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-background mb-4 leading-tight">
              Not just links —<br />
              real analysis
            </h2>
            <p className="text-background/60 max-w-md mb-8 leading-relaxed">
              Each digest reads like it was written by a sharp friend who spent
              hours reading so you don&apos;t have to.
            </p>
            <div className="space-y-4 text-sm text-background/50">
              <div className="flex gap-3">
                <span className="font-serif text-lg font-bold text-background/20 shrink-0 leading-none mt-0.5">
                  01
                </span>
                <p>
                  <span className="text-background font-medium">
                    Editorial headlines
                  </span>{" "}
                  — not just restated article titles. Punchy, opinionated, to
                  the point.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="font-serif text-lg font-bold text-background/20 shrink-0 leading-none mt-0.5">
                  02
                </span>
                <p>
                  <span className="text-background font-medium">
                    The &ldquo;so what&rdquo;
                  </span>{" "}
                  — every story explains why it matters to you, not just what
                  happened.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="font-serif text-lg font-bold text-background/20 shrink-0 leading-none mt-0.5">
                  03
                </span>
                <p>
                  <span className="text-background font-medium">
                    Social consensus
                  </span>{" "}
                  — see what experts and the public are saying on Bluesky.
                </p>
              </div>
            </div>
          </div>

          {/* Right: mock newsletter */}
          <div className="border border-background/20 bg-background text-foreground overflow-hidden">
            {/* Mock header */}
            <div className="px-5 pt-5 pb-4 border-b border-foreground/10">
              <div className="border-t-2 border-foreground mb-3" />
              <p className="text-[10px] font-bold tracking-[0.15em] text-muted-foreground uppercase mb-1.5">
                AI & Tech Weekly · March 22, 2026
              </p>
              <p className="font-serif text-lg font-bold text-foreground leading-snug">
                The Model Wars Heat Up
              </p>
            </div>

            {/* Mock takeaways */}
            <div className="px-5 py-4 border-b border-foreground/10">
              <p className="text-[10px] font-bold tracking-[0.12em] text-muted-foreground uppercase mb-2.5">
                In this edition
              </p>
              <ul className="space-y-1.5 text-xs text-foreground/80">
                <li className="flex gap-2">
                  <span className="text-muted-foreground/50 shrink-0">
                    &mdash;
                  </span>
                  OpenAI drops a new reasoning model — and it&apos;s surprisingly
                  cheap
                </li>
                <li className="flex gap-2">
                  <span className="text-muted-foreground/50 shrink-0">
                    &mdash;
                  </span>
                  Anthropic&apos;s agent SDK goes open source
                </li>
                <li className="flex gap-2">
                  <span className="text-muted-foreground/50 shrink-0">
                    &mdash;
                  </span>
                  NVIDIA earnings crush estimates, stock rips
                </li>
              </ul>
            </div>

            {/* Mock items */}
            <div className="px-5 py-4 space-y-4">
              <div>
                <p className="font-serif text-sm font-semibold text-foreground mb-1">
                  OpenAI&apos;s New Model Does More for Less
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  The new reasoning model matches GPT-5 on most benchmarks at
                  1/10th the cost. A clear play to undercut competitors on price
                  while enterprise adoption accelerates.
                </p>
              </div>
              <div className="border-t border-foreground/10 pt-4">
                <p className="font-serif text-sm font-semibold text-foreground mb-1">
                  Anthropic Open-Sources Agent Framework
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  The Claude Agent SDK is now public — tool use, multi-step
                  reasoning, and memory out of the box. Developers are already
                  building production agents with it.
                </p>
              </div>
            </div>

            {/* Mock social consensus */}
            <div className="px-5 py-4 border-t border-foreground/10">
              <p className="text-[10px] font-bold tracking-[0.12em] text-muted-foreground uppercase mb-2 flex items-center gap-1.5">
                <MessageCircle className="h-3 w-3" />
                The discourse
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed italic">
                &ldquo;The pricing on this new model is insane. OpenAI just made
                the enterprise tier irrelevant for 90% of use cases.&rdquo;
              </p>
              <p className="text-[10px] text-muted-foreground/50 mt-1">
                @karpathy · 4.2K likes
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
