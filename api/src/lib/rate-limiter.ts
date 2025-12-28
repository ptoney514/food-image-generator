import { Context, MiddlewareHandler } from 'hono';
import type { Bindings, Variables } from './types';

interface RateLimitConfig {
  limit: number;
  windowMs: number;
  keyPrefix: string;
  message?: string;
}

interface RateLimitInfo {
  count: number;
  resetAt: number;
}

/**
 * Simple in-memory rate limiter using Cache API
 * For production with multiple workers, use KV or Durable Objects
 */
export function rateLimiter(config: RateLimitConfig): MiddlewareHandler<{
  Bindings: Bindings;
  Variables: Variables;
}> {
  const { limit, windowMs, keyPrefix, message = 'Rate limit exceeded' } = config;

  return async (c, next) => {
    // Get identifier (user ID if authenticated, otherwise IP)
    const userId = c.get('userId');
    const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';
    const identifier = userId || ip;
    const key = `${keyPrefix}:${identifier}`;

    // Use Cache API for rate limiting (works across requests within same colo)
    const cache = caches.default;
    const cacheKey = new Request(`https://rate-limit.internal/${key}`);

    let info: RateLimitInfo;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Try to get existing rate limit info
    const cached = await cache.match(cacheKey);

    if (cached) {
      info = await cached.json();

      // Reset if window has passed
      if (info.resetAt < now) {
        info = { count: 0, resetAt: now + windowMs };
      }
    } else {
      info = { count: 0, resetAt: now + windowMs };
    }

    // Check if over limit
    if (info.count >= limit) {
      const retryAfter = Math.ceil((info.resetAt - now) / 1000);

      c.header('X-RateLimit-Limit', limit.toString());
      c.header('X-RateLimit-Remaining', '0');
      c.header('X-RateLimit-Reset', Math.ceil(info.resetAt / 1000).toString());
      c.header('Retry-After', retryAfter.toString());

      return c.json({ error: message, retryAfter }, 429);
    }

    // Increment count
    info.count++;

    // Store updated info in cache
    const response = new Response(JSON.stringify(info), {
      headers: {
        'Cache-Control': `max-age=${Math.ceil(windowMs / 1000)}`,
        'Content-Type': 'application/json',
      },
    });
    await cache.put(cacheKey, response);

    // Set rate limit headers
    c.header('X-RateLimit-Limit', limit.toString());
    c.header('X-RateLimit-Remaining', (limit - info.count).toString());
    c.header('X-RateLimit-Reset', Math.ceil(info.resetAt / 1000).toString());

    await next();
  };
}

/**
 * Pre-configured rate limiters
 */
export const rateLimiters = {
  // Strict limit for image generation (costs money)
  imageGeneration: rateLimiter({
    limit: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
    keyPrefix: 'rl:generate',
    message: 'Image generation rate limit exceeded. Maximum 10 images per hour.',
  }),

  // Standard limit for read operations
  standard: rateLimiter({
    limit: 100,
    windowMs: 60 * 1000, // 1 minute
    keyPrefix: 'rl:standard',
    message: 'Rate limit exceeded. Please slow down.',
  }),
};
