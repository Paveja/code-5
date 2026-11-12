import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self' https://checkout.stripe.com",
  "img-src 'self' data: blob: https://images.unsplash.com",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  `script-src 'self' 'unsafe-inline' ${isProduction ? "" : "'unsafe-eval'"} https://js.stripe.com https://checkout.stripe.com`,
  "connect-src 'self' https://api.stripe.com https://*.stripe.com https://api.resend.com",
  "frame-src https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com",
].join("; ");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    const securityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      { key: "Content-Security-Policy", value: csp },
      { key: "Cross-Origin-Resource-Policy", value: "same-site" },
      { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
    ];
    if (isProduction) {
      securityHeaders.push({
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      });
    }

    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
