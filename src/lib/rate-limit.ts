/**
 * In-memory sliding-window rate limiter for Next.js Route Handlers.
 * Protects endpoints from brute-force password guessing, flood attacks, and spam.
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

// Clean up expired buckets every 2 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitMap.entries()) {
      if (record.resetAt <= now) {
        rateLimitMap.delete(key);
      }
    }
  }, 2 * 60 * 1000).unref?.();
}

export interface RateLimitOptions {
  windowMs?: number; // Time window in milliseconds (default: 60s)
  max?: number;      // Max allowed requests in this window (default: 20)
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  headers: Record<string, string>;
}

/**
 * Extracts a dependable client IP from proxy headers.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0].trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const cfConnectingIp = request.headers.get("cf-connecting-ip")?.trim();
  if (cfConnectingIp) return cfConnectingIp;

  return "127.0.0.1";
}

/**
 * Rate limits an action by a unique key (e.g. IP, IP+route, or user ID).
 */
export function checkRateLimit(
  key: string,
  options: RateLimitOptions = {}
): RateLimitResult {
  const windowMs = options.windowMs ?? 60 * 1000;
  const max = options.max ?? 20;
  const now = Date.now();

  const record = rateLimitMap.get(key);

  if (!record || record.resetAt <= now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    const remaining = max - 1;
    const resetSeconds = Math.ceil(windowMs / 1000);
    return {
      success: true,
      limit: max,
      remaining,
      reset: now + windowMs,
      headers: {
        "X-RateLimit-Limit": String(max),
        "X-RateLimit-Remaining": String(remaining),
        "X-RateLimit-Reset": String(resetSeconds),
      },
    };
  }

  record.count += 1;
  const remaining = Math.max(0, max - record.count);
  const resetSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
  const success = record.count <= max;

  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(max),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(resetSeconds),
  };

  if (!success) {
    headers["Retry-After"] = String(resetSeconds);
  }

  return {
    success,
    limit: max,
    remaining,
    reset: record.resetAt,
    headers,
  };
}
