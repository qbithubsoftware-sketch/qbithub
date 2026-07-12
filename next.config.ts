import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Production hardening: do NOT ignore build errors
  typescript: {
    ignoreBuildErrors: false,
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
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
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
    ],
  },
  // Compress responses
  compress: true,
  // Power by header (security through obscurity)
  poweredByHeader: false,
};

export default nextConfig;
