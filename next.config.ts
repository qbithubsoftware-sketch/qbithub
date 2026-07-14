import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Production hardening: do NOT ignore build errors
  typescript: {
    ignoreBuildErrors: false,
    // Exclude ad-hoc scripts/ folder from production type-checking.
    // Those are one-off DB seed/migration scripts, not part of the app bundle.
    tsconfigPath: "./tsconfig.build.json",
  },
  // Enable React strict mode for production safety
  reactStrictMode: true,
  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // PWA: allow camera (for photo capture) + geolocation (for engineer tracking)
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(self)" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
        ],
      },
      // Service worker must not be cached — always fetch fresh
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      // Manifest must not be cached either
      {
        source: "/manifest.json",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "api.qrserver.com" },
      { protocol: "https", hostname: "hub.qbit.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
    ],
  },
  // Compress responses
  compress: true,
  // Power by header (security through obscurity)
  poweredByHeader: false,
};

export default nextConfig;
