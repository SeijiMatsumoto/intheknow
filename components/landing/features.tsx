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
    desc: "Searches news sites, blogs, and Twitter/X for the most relevant stories on your topic.",
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
    desc: "See what experts and the public are saying on Twitter about each story.",
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
    <section className="border-t border-border bg-card/30">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-20 sm:py-28">
        <p className="text-xs font-bold tracking-widest text-accent uppercase mb-3">
          Features
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-14">
          Everything you need, nothing you don&apos;t
        </h2>

        <div className="grid sm:grid-cols-2 gap-x-10 gap-y-8">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex gap-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <f.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">
                  {f.title}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {f.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
