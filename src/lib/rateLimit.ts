import { NextRequest, NextResponse } from 'next/server';
import { cache } from './cache';

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum number of requests per windowMs
  message?: string;
  statusCode?: number;
}

export function rateLimit(options: RateLimitOptions) {
  const { windowMs, max, message = 'Too many requests, please try again later.', statusCode = 429 } = options;

  return (req: NextRequest) => {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const key = `rate-limit:${ip}`;

    // Get current request count
    const current = cache.get<number>(key) || 0;

    // Increment request count
    cache.set(key, current + 1, windowMs);

    // Check if rate limit exceeded
    if (current >= max) {
      return NextResponse.json(
        { error: message },
        { status: statusCode, headers: { 'Retry-After': Math.ceil(windowMs / 1000).toString() } }
      );
    }

    return null;
  };
}

// Default rate limiter (100 requests per 15 minutes)
export const defaultRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
});
