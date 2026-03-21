import { createHmac } from "crypto";

const SECRET =
  process.env.UNSUBSCRIBE_SECRET ?? process.env.CLERK_SECRET_KEY ?? "fallback";

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("hex");
}

/** Build a signed unsubscribe URL for a given user + newsletter. */
export function buildUnsubscribeUrl(
  userId: string,
  newsletterId: string,
): string {
  const payload = `${userId}:${newsletterId}`;
  const token = sign(payload);
  const base =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://thelatest.app";
  return `${base}/unsubscribe?uid=${encodeURIComponent(userId)}&nid=${encodeURIComponent(newsletterId)}&token=${token}`;
}

/** Verify an unsubscribe token. Returns true if valid. */
export function verifyUnsubscribeToken(
  userId: string,
  newsletterId: string,
  token: string,
): boolean {
  const payload = `${userId}:${newsletterId}`;
  const expected = sign(payload);
  return token === expected;
}
