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
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-28">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Common questions
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {QUESTIONS.map((item) => (
            <div key={item.q} className="rounded-xl bg-secondary/30 p-6">
              <p className="text-base font-semibold text-foreground mb-2">
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
