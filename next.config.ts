import type { NextConfig } from "next";

const development = process.env.NODE_ENV === "development";
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  `script-src 'self' 'unsafe-inline'${development ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://images.unsplash.com",
  "font-src 'self' data:",
  `connect-src 'self' https://raw.githubusercontent.com${development ? " ws: wss:" : ""}`,
  "manifest-src 'self'",
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
];

const noStoreHeaders = [
  { key: "Cache-Control", value: "private, no-store, max-age=0" },
  { key: "Pragma", value: "no-cache" },
];

const sensitiveSources = [
  "/comercio/:path*",
  "/premio/:path*",
  "/validar/:path*",
  "/api/merchant/:path*",
  "/api/onboarding/:path*",
  "/api/rewards/:path*",
  "/api/sessions/:path*",
  "/api/share-card/:path*",
];

function maurilioOrigin() {
  const raw = process.env.MAURILIO_ORIGIN?.replace(/\/$/, "");
  if (!raw) return null;

  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || url.origin !== raw) return null;
    return url.origin;
  } catch {
    return null;
  }
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async rewrites() {
    const origin = maurilioOrigin();
    const maurilio = origin
      ? [
          {
            source: "/maurilio",
            destination: `${origin}/maurilio`,
          },
          {
            source: "/maurilio/:path*",
            destination: `${origin}/maurilio/:path*`,
          },
        ]
      : [];

    return {
      // When a Maurilio origin exists it must override the local fallback
      // route. If the origin is absent, the filesystem fallback remains live
      // instead of exposing Next.js' generic 404.
      beforeFiles: maurilio,
      afterFiles: [],
      fallback: [],
    };
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      ...sensitiveSources.map((source) => ({ source, headers: noStoreHeaders })),
    ];
  },
};

export default nextConfig;
