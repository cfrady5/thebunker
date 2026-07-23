import "server-only";

/**
 * Lightweight fixed-window rate limiter.
 *
 * In-memory per server instance — sufficient for a single-region
 * deployment of this size and for protecting form endpoints from
 * casual abuse. For multi-instance scale, swap the store for
 * Upstash Redis or Vercel KV behind the same interface.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

const LIMITS: Record<string, { max: number; windowMs: number }> = {
  interest: { max: 5, windowMs: 60_000 },
  contact: { max: 5, windowMs: 60_000 },
  private_event: { max: 3, windowMs: 60_000 },
  auth: { max: 10, windowMs: 60_000 },
  hold: { max: 12, windowMs: 60_000 },
  gift_card_check: { max: 6, windowMs: 60_000 },
  discount_check: { max: 6, windowMs: 60_000 },
};

export function checkRateLimit(
  scope: keyof typeof LIMITS | string,
  identifier: string,
): { allowed: boolean; retryAfterSeconds: number } {
  const limit = LIMITS[scope] ?? { max: 10, windowMs: 60_000 };
  const key = `${scope}:${identifier}`;
  const now = Date.now();

  // Opportunistic cleanup to bound memory.
  if (buckets.size > 10_000) {
    for (const [k, b] of buckets) {
      if (b.resetAt < now) buckets.delete(k);
    }
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + limit.windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (bucket.count >= limit.max) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}
