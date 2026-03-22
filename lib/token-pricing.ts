/**
 * Token pricing and cost calculation for LLM and API usage.
 *
 * Prices are per 1M tokens unless otherwise noted.
 * Update these when provider pricing changes.
 */

type ModelPricing = {
  input: number;
  cachedInput: number;
  output: number;
};

/** Prices per 1M tokens. */
const MODEL_PRICING: Record<string, ModelPricing> = {
  "gpt-5.4": {
    input: 2.5,
    cachedInput: 0.25,
    output: 15.0,
  },
  "gpt-5.4-mini": {
    input: 0.75,
    cachedInput: 0.075,
    output: 4.5,
  },
  "gpt-5.4-nano": {
    input: 0.2,
    cachedInput: 0.02,
    output: 1.25,
  },
  "gpt-4o-mini": {
    input: 0.15,
    cachedInput: 0.0075,
    output: 0.6,
  },
};

/** Price per request for non-token-based APIs. */
const API_PRICING = {
  /** Perplexity Search API — price per search query. */
  perplexitySearch: 0.005,
  /** twitterapi.io — price per 1K tweets fetched. */
  twitterPer1K: 0.15,
  /** Resend — price per email (overage rate). */
  resendPerEmail: 0.0009,
} as const;

export type CostBreakdown = {
  model: string;
  inputTokens: number;
  outputTokens: number;
  llmCost: number;
  searchCosts: {
    webSearches: number;
    webSearchCost: number;
    twitterSearches: number;
    twitterCost: number;
  };
  totalCost: number;
};

/** Calculate LLM cost for a given model and token counts. */
export function llmCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const pricing = MODEL_PRICING[model];
  if (!pricing) return 0;

  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  return inputCost + outputCost;
}

/** Calculate full cost breakdown for a digest run. */
export function digestCostBreakdown(
  model: string,
  inputTokens: number,
  outputTokens: number,
  toolCallCounts: Record<string, number>,
): CostBreakdown {
  const llm = llmCost(model, inputTokens, outputTokens);

  const webSearches = toolCallCounts.searchWeb ?? 0;
  const webSearchCost = webSearches * API_PRICING.perplexitySearch;

  const twitterSearches = toolCallCounts.searchTwitter ?? 0;
  // Estimate ~30 tweets per search (up to 3 queries × 10 tweets each)
  const twitterCost = twitterSearches * 30 * (API_PRICING.twitterPer1K / 1000);

  return {
    model,
    inputTokens,
    outputTokens,
    llmCost: llm,
    searchCosts: {
      webSearches,
      webSearchCost,
      twitterSearches,
      twitterCost,
    },
    totalCost: llm + webSearchCost + twitterCost,
  };
}

/** Format cost breakdown as a human-readable log string. */
export function formatCostLog(cost: CostBreakdown): string {
  const parts = [
    `model=${cost.model}`,
    `tokens=${cost.inputTokens}in/${cost.outputTokens}out`,
    `llm=$${cost.llmCost.toFixed(4)}`,
  ];

  if (cost.searchCosts.webSearches > 0) {
    parts.push(
      `web=${cost.searchCosts.webSearches}×$${cost.searchCosts.webSearchCost.toFixed(4)}`,
    );
  }

  if (cost.searchCosts.twitterSearches > 0) {
    parts.push(
      `twitter=${cost.searchCosts.twitterSearches}×$${cost.searchCosts.twitterCost.toFixed(4)}`,
    );
  }

  parts.push(`total=$${cost.totalCost.toFixed(4)}`);

  return parts.join(", ");
}
