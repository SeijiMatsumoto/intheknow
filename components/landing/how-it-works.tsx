import { BookOpen, Clock, Search } from "lucide-react";

const STEPS = [
  {
    icon: BookOpen,
    title: "Subscribe to topics",
    desc: "Browse curated newsletters on AI, finance, crypto, politics, and more — or create your own with custom keywords.",
  },
  {
    icon: Search,
    title: "AI does the research",
    desc: "Our agent searches the web and social media, filters for relevance, and identifies what actually matters — no fluff.",
  },
  {
    icon: Clock,
    title: "Digest in your inbox",
    desc: "Get a concise, well-written newsletter on your schedule — daily or weekly. Read in 5 minutes, stay informed all day.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-border">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-20 sm:py-28">
        <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase mb-3">
          How it works
        </p>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground mb-4">
          Your personal newsroom, automated
        </h2>
        <p className="text-muted-foreground max-w-xl mb-14">
          Pick a topic. We handle the rest — from research to your inbox.
        </p>

        <div className="grid sm:grid-cols-3 gap-6 sm:gap-8">
          {STEPS.map((step) => (
            <div key={step.title} className="flex flex-col gap-3">
              <div className="flex h-10 w-10 items-center justify-center border border-border text-foreground">
                <step.icon className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
