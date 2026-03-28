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
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-28">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Everything you need, nothing you don&apos;t
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Powerful features wrapped in a simple experience.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-xl bg-secondary/30 p-6 transition-colors hover:bg-secondary/50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-foreground/5 text-foreground mb-4">
                <f.icon className="h-5 w-5" />
              </div>
              <p className="text-base font-semibold text-foreground mb-2">
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
