/**
 * Next.js middleware — rate limiting + security headers for API routes.
 *
 * Rate limits are applied per-IP using an in-memory Map (suitable for
 * single-instance deployments).  In production with multiple instances,
 * replace with Redis or a dedicated rate-limit service.
 */

import { NextRequest, NextResponse } from "next/server";

// ---------- Rate limit configuration ----------

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  "/api/ai/chat": { windowMs: 60_000, maxRequests: 10 },      // 10/min
  "/api/public/contact": { windowMs: 60_000, maxRequests: 5 }, // 5/min
  "/api/public/newsletter": { windowMs: 60_000, maxRequests: 5 },
  "/api/downloads": { windowMs: 60_000, maxRequests: 30 },     // 30/min
  "/api/admin": { windowMs: 60_000, maxRequests: 60 },         // 60/min
  "/api/public": { windowMs: 60_000, maxRequests: 100 },       // 100/min
};

const DEFAULT_LIMIT: RateLimitConfig = { windowMs: 60_000, maxRequests: 60 };

// ---------- In-memory rate limit store ----------

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

function getRateLimit(pathname: string): RateLimitConfig {
  for (const [prefix, config] of Object.entries(RATE_LIMITS)) {
    if (pathname.startsWith(prefix)) return config;
  }
  return DEFAULT_LIMIT;
}

function checkRateLimit(ip: string, pathname: string): { allowed: boolean; remaining: number; resetAt: number } {
  const config = getRateLimit(pathname);
  const key = `${ip}:${pathname}`;
  const now = Date.now();

  const entry = rateLimitStore.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + config.windowMs };
  }

  entry.count++;
  if (entry.count > config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  return { allowed: true, remaining: config.maxRequests - entry.count, resetAt: entry.resetAt };
}

// ---------- Middleware ----------

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only rate-limit API routes
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Get client IP (behind proxy)
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? req.headers.get("x-real-ip")
    ?? "unknown";

  const { allowed, remaining, resetAt } = checkRateLimit(ip, pathname);

  if (!allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)),
          "X-RateLimit-Limit": String(getRateLimit(pathname).maxRequests),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(resetAt),
        },
      },
    );
  }

  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Remaining", String(remaining));
  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
