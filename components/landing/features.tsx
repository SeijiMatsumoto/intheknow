import {
  BookOpen,
  Clock,
  MessageCircle,
  Search,
  Sparkles,
  Zap,
} from "lucide-react";

const FEATURES = [
  {
    icon: Search,
    title: "Web + social research",
    desc: "Searches news sites, blogs, and Bluesky for the most relevant stories on your topic.",
  },
  {
    icon: Sparkles,
    title: "AI-written digests",
    desc: "Not just aggregation — each newsletter is written with editorial voice, analysis, and context.",
  },
  {
    icon: Clock,
    title: "Your schedule",
    desc: "Daily or weekly delivery. Pick the days and time that work for you.",
  },
  {
    icon: MessageCircle,
    title: "Social consensus",
    desc: "See what experts and the public are saying on Bluesky about each story.",
  },
  {
    icon: BookOpen,
    title: "Custom newsletters",
    desc: "Create your own newsletter with custom keywords and preferred sources.",
  },
  {
    icon: Zap,
    title: "Browse anytime",
    desc: "Every digest is also viewable on the web. Read past editions whenever you want.",
  },
];

export function Features() {
  return (
    <section>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
        <div className="border-t-[3px] border-foreground mb-4" />
        <div className="flex items-baseline justify-between mb-10">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
            Everything you need, nothing you don&apos;t
          </h2>
          <p className="hidden sm:block text-[10px] font-bold tracking-[0.15em] text-muted-foreground uppercase">
            Features
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-0">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className={`py-5 sm:px-6 ${
                i % 3 === 0 ? "sm:pl-0" : i % 3 === 2 ? "sm:pr-0" : ""
              } ${i % 3 !== 0 ? "sm:border-l border-foreground/10" : ""} ${
                i >= 3 ? "border-t border-foreground/10" : ""
              }`}
            >
              <div className="flex h-9 w-9 items-center justify-center border border-foreground/15 text-foreground mb-4">
                <f.icon className="h-4 w-4" />
              </div>
              <p className="font-serif text-base font-semibold text-foreground mb-2">
                {f.title}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
