// Simple per-visitor rate limit, kept in memory.
// Good enough for one server instance; on serverless each instance counts separately,
// so treat it as abuse protection, not an exact quota. Swap for a shared store (e.g. Redis) if needed.

export type RateLimiter = (key: string, now?: number) => boolean;

export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }): RateLimiter {
  const hits = new Map<string, number[]>();
  return (key, now = Date.now()) => {
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    if (recent.length >= limit) {
      hits.set(key, recent);
      return false;
    }
    recent.push(now);
    hits.set(key, recent);
    if (hits.size > 10_000) hits.clear(); // bound memory
    return true;
  };
}
