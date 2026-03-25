const QUESTIONS = [
  {
    q: "How is this different from Google Alerts or RSS?",
    a: "Google Alerts sends you raw links. RSS dumps every post. We read everything, filter for what matters, and write you a concise digest with context and analysis — like a smart friend summarizing the news.",
  },
  {
    q: "What topics are available?",
    a: "We have curated newsletters on AI & tech, finance, crypto, politics, gaming, science, and more. Plus and Pro users can create custom newsletters on any topic with their own keywords.",
  },
  {
    q: "How often will I get emails?",
    a: "You choose — daily or weekly. Plus and Pro users can customize exactly which days and time they receive each newsletter.",
  },
  {
    q: "What's the difference between Free and paid plans?",
    a: "Free gets you headline digests — you'll see what stories were covered but not the full analysis. Paid plans include detailed analysis, quotes, source links, and social media reactions.",
  },
  {
    q: "Can I unsubscribe?",
    a: "Yes, anytime. Every email has an unsubscribe link, or you can manage subscriptions from your settings page. No lock-in, no questions asked.",
  },
  {
    q: "What AI models do you use?",
    a: "We use a combination of models for research, filtering, and writing. Higher tiers get more powerful models for deeper analysis and better-quality digests.",
  },
];

export function FAQ() {
  return (
    <section id="faq">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
        <div className="border-t-[3px] border-foreground mb-4" />
        <div className="flex items-baseline justify-between mb-8">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
            Common questions
          </h2>
          <p className="hidden sm:block text-[10px] font-bold tracking-[0.15em] text-muted-foreground uppercase">
            FAQ
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-0">
          {QUESTIONS.map((item, i) => (
            <div
              key={item.q}
              className={`py-6 ${
                i % 2 === 0 ? "sm:pr-8" : "sm:pl-8 sm:border-l border-foreground/10"
              } ${i >= 2 ? "border-t border-foreground/10" : ""}`}
            >
              <p className="font-serif text-base font-semibold text-foreground mb-2">
                {item.q}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
