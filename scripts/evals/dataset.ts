import type { NewsletterInput } from "@/inngest/functions/newsletter-agent";

// Placeholder ID for evals — searchPriorCoverage will return empty results
const EVAL_NEWSLETTER_ID = "00000000-0000-0000-0000-000000000000";

export const EVAL_DATASET: { inputs: NewsletterInput }[] = [
  {
    inputs: {
      title: "AI Daily Brief",
      newsletterId: EVAL_NEWSLETTER_ID,
      description:
        "Everything that happened in AI today — model drops, product launches, industry moves, and the tools worth knowing about.",
      frequency: "daily",
      keywords: [
        "AI news",
        "model release",
        "LLM",
        "OpenAI",
        "Anthropic",
        "Google DeepMind",
        "AI tools",
        "AI industry",
      ],
      tier: "pro",
    },
  },
  {
    inputs: {
      title: "Markets Daily",
      newsletterId: EVAL_NEWSLETTER_ID,
      description:
        "What moved markets today — equities, crypto, commodities, and the macro signals driving them.",
      frequency: "daily",
      keywords: [
        "stock market",
        "S&P 500",
        "crypto",
        "Bitcoin",
        "Fed",
        "interest rates",
        "earnings",
        "equities",
        "commodities",
      ],
      tier: "free",
    },
  },
  {
    inputs: {
      title: "Science Weekly",
      newsletterId: EVAL_NEWSLETTER_ID,
      description:
        "Breakthroughs in physics, biology, space, and climate — the discoveries that are changing how we understand the world.",
      frequency: "weekly",
      keywords: [
        "science",
        "physics",
        "biology",
        "space",
        "NASA",
        "climate",
        "research",
        "discovery",
        "medicine",
      ],
      tier: "plus",
    },
  },
  {
    inputs: {
      title: "Level Up",
      newsletterId: EVAL_NEWSLETTER_ID,
      description:
        "Game releases, industry news, developer updates, and what's actually worth playing this week.",
      frequency: "weekly",
      keywords: [
        "video games",
        "game release",
        "Nintendo",
        "PlayStation",
        "Xbox",
        "Steam",
        "esports",
        "indie games",
        "game dev",
      ],
      tier: "free",
    },
  },
  {
    inputs: {
      title: "Threat Brief",
      newsletterId: EVAL_NEWSLETTER_ID,
      description:
        "Breaches, vulnerabilities, threat intelligence, and the security stories that matter — no FUD, just signal.",
      frequency: "daily",
      keywords: [
        "cybersecurity",
        "data breach",
        "vulnerability",
        "CVE",
        "ransomware",
        "zero-day",
        "CISA",
        "threat intelligence",
        "infosec",
      ],
      tier: "free",
    },
  },
];
