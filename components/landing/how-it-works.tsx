import { BookOpen, Clock, Search } from "lucide-react";

const STEPS = [
  {
    icon: BookOpen,
    number: "1",
    title: "Subscribe to topics",
    desc: "Browse curated newsletters on AI, finance, crypto, politics, and more — or create your own with custom keywords.",
  },
  {
    icon: Search,
    number: "2",
    title: "AI does the research",
    desc: "Our agent searches the web and social media, filters for relevance, and identifies what actually matters — no fluff.",
  },
  {
    icon: Clock,
    number: "3",
    title: "Digest in your inbox",
    desc: "Get a concise, well-written newsletter on your schedule — daily or weekly. Read in 5 minutes, stay informed all day.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-28">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Your personal newsroom, automated
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Three steps to never miss what matters again.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          {STEPS.map((step) => (
            <div
              key={step.title}
              className="rounded-xl bg-secondary/30 p-6 sm:p-8"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-foreground text-background text-sm font-bold">
                  {step.number}
                </div>
                <step.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
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
