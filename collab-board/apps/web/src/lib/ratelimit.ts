import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Gracefully degrade if Upstash is not configured
function createRatelimiter(requests: number, window: string) {
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return null;
  }

  return new Ratelimit({
    redis: new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    }),
    limiter: Ratelimit.slidingWindow(requests, window as any),
  });
}

// 5 room creations per hour per user
export const createRoomLimiter = createRatelimiter(5, "1 h");

// 20 room joins per hour per user
export const joinRoomLimiter = createRatelimiter(20, "1 h");

// 30 API requests per minute per user (general)
export const generalLimiter = createRatelimiter(30, "1 m");

// Helper to apply rate limit and return error response if exceeded
export async function applyRateLimit(
  limiter: Ratelimit | null,
  identifier: string
): Promise<{ limited: boolean; response?: Response }> {
  if (!limiter) return { limited: false };

  const { success, limit, remaining, reset } = await limiter.limit(identifier);

  if (!success) {
    return {
      limited: true,
      response: new Response(
        JSON.stringify({
          error: "Too many requests. Please slow down.",
          retryAfter: Math.ceil((reset - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
          },
        }
      ),
    };
  }

  return { limited: false };
}