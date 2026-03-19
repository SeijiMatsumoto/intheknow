import { inngest } from "@/inngest/client";

export const newsletterWorker = inngest.createFunction(
  {
    id: "newsletter-worker",
    retries: 2,
    triggers: [{ event: "newsletter/run" }],
  },
  async ({ event }) => {
    const { newsletterId } = event.data;

    // TODO: step — load newsletter + active subscribers from DB
    // TODO: step — create digest_run record (status: "running")
    // TODO: step (parallel) — scrape.web via Firecrawl
    // TODO: step (parallel) — scrape.twitter via twitterapi.io
    // TODO: step — score items (freshness + LLM relevance)
    // TODO: step — filter items (drop below threshold, rank)
    // TODO: step — synthesize digest with Claude Sonnet
    // TODO: step — validate no hallucinated URLs
    // TODO: step — render HTML email
    // TODO: step — fan out newsletter/email.send per active subscriber
    // TODO: step — update digest_run status to "sent"

    return { newsletterId, status: "stub" };
  },
);
