import { BookOpen, Clock, Search } from "lucide-react";

const STEPS = [
  {
    icon: BookOpen,
    number: "I",
    title: "Subscribe to topics",
    desc: "Browse curated newsletters on AI, finance, crypto, politics, and more — or create your own with custom keywords.",
  },
  {
    icon: Search,
    number: "II",
    title: "AI does the research",
    desc: "Our agent searches the web and social media, filters for relevance, and identifies what actually matters — no fluff.",
  },
  {
    icon: Clock,
    number: "III",
    title: "Digest in your inbox",
    desc: "Get a concise, well-written newsletter on your schedule — daily or weekly. Read in 5 minutes, stay informed all day.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
        <div className="border-t-[3px] border-foreground mb-4" />
        <div className="flex items-baseline justify-between mb-8">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
            Your personal newsroom, automated
          </h2>
          <p className="hidden sm:block text-[10px] font-bold tracking-[0.15em] text-muted-foreground uppercase">
            How it works
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-0">
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              className={`flex flex-col gap-4 py-6 sm:py-0 sm:px-6 ${
                i === 0
                  ? "sm:pl-0 border-b sm:border-b-0"
                  : i === STEPS.length - 1
                    ? "sm:pr-0 sm:border-l border-foreground/10"
                    : "border-b sm:border-b-0 sm:border-l border-foreground/10"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="font-serif text-2xl font-bold text-foreground/20">
                  {step.number}
                </span>
                <div className="flex h-9 w-9 items-center justify-center border border-foreground/15 text-foreground">
                  <step.icon className="h-4 w-4" />
                </div>
              </div>
              <h3 className="font-serif text-lg font-semibold text-foreground">
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
