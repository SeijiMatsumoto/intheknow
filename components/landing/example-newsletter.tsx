import { MessageCircle } from "lucide-react";

export function ExampleNewsletter() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-20 sm:py-28">
        <p className="text-xs font-bold tracking-widest text-accent uppercase mb-3">
          What you get
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
          Not just links — real analysis
        </h2>
        <p className="text-muted-foreground max-w-xl mb-14">
          Each digest reads like it was written by a sharp friend who spent hours
          reading so you don&apos;t have to.
        </p>

        <div className="mx-auto max-w-[520px] rounded-xl border border-border bg-card overflow-hidden text-left">
          {/* Mock header */}
          <div className="px-5 pt-5 pb-4 border-b border-border">
            <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-1.5">
              AI & Tech Weekly
            </p>
            <p className="text-base font-semibold text-foreground leading-snug">
              The Model Wars Heat Up
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Weekly · March 22, 2026
            </p>
          </div>

          {/* Mock takeaways */}
          <div className="px-5 py-4 bg-amber-50 dark:bg-amber-950/20 border-b border-border">
            <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-2">
              In this edition
            </p>
            <ul className="space-y-1.5 text-xs text-foreground/80">
              <li className="flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                OpenAI drops a new reasoning model — and it&apos;s surprisingly
                cheap
              </li>
              <li className="flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                Anthropic&apos;s agent SDK goes open source
              </li>
              <li className="flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                NVIDIA earnings crush estimates, stock rips
              </li>
            </ul>
          </div>

          {/* Mock items */}
          <div className="px-5 py-4 space-y-4">
            <div>
              <p className="text-sm font-semibold text-foreground mb-1">
                🔥 OpenAI&apos;s New Model Does More for Less
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The new reasoning model matches GPT-5 on most benchmarks at
                1/10th the cost. A clear play to undercut competitors on price
                while enterprise adoption accelerates.
              </p>
            </div>
            <div className="border-t border-border pt-4">
              <p className="text-sm font-semibold text-foreground mb-1">
                🤖 Anthropic Open-Sources Agent Framework
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The Claude Agent SDK is now public — tool use, multi-step
                reasoning, and memory out of the box. Developers are already
                building production agents with it.
              </p>
            </div>
          </div>

          {/* Mock social consensus */}
          <div className="px-5 py-4 bg-blue-50 dark:bg-blue-950/20 border-t border-border">
            <p className="text-[10px] font-bold tracking-widest text-blue-400 uppercase mb-2 flex items-center gap-1.5">
              <MessageCircle className="h-3 w-3" />
              The discourse
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed italic">
              &ldquo;The pricing on this new model is insane. OpenAI just made
              the enterprise tier irrelevant for 90% of use cases.&rdquo;
            </p>
            <p className="text-[10px] text-muted-foreground/70 mt-1">
              @karpathy · 4.2K likes
            </p>
          </div>

          {/* Mock footer */}
          <div className="px-5 py-3 bg-secondary/50 border-t border-border">
            <p className="text-[10px] text-muted-foreground">
              Sources: The Verge, TechCrunch, Ars Technica + 4 more
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
