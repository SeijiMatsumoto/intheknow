type EvalInput = {
  outputs: Record<string, unknown>;
};

const GOOD_THRESHOLD = 90_000;
const MAX_THRESHOLD = 180_000;

export function latencyEvaluator({ outputs }: EvalInput) {
  const durationMs = (outputs.durationMs as number) ?? 0;
  const seconds = (durationMs / 1000).toFixed(1);

  let score: number;
  if (durationMs <= GOOD_THRESHOLD) {
    score = 1;
  } else if (durationMs >= MAX_THRESHOLD) {
    score = 0;
  } else {
    score =
      1 - (durationMs - GOOD_THRESHOLD) / (MAX_THRESHOLD - GOOD_THRESHOLD);
  }

  return {
    key: "latency",
    score: Math.round(score * 100) / 100,
    comment: `${seconds}s (threshold: ${GOOD_THRESHOLD / 1000}s good, ${MAX_THRESHOLD / 1000}s max)`,
  };
}
