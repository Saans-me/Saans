import type { NextConfig } from "next";

// Clinician and college forms may post to a separate endpoint (see forms.ts); everything else is same-origin.
// An analytics provider added later (GTM, say) needs its origins added here too.
const formEndpoint = process.env.NEXT_PUBLIC_FORM_ENDPOINT;
const connectSrc = ["'self'", ...(formEndpoint?.startsWith("http") ? [new URL(formEndpoint).origin] : [])].join(" ");

// Scripts and styles aren't restricted: the theme script and Next's hydration are inline,
// and locking them down needs per-request nonces, which would make every page dynamic.
// connect-src is what keeps form data from going anywhere but this site's own server.
const csp = [
  `connect-src ${connectSrc}`,
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
].join("; ");

const nextConfig: NextConfig = {
  images: { formats: ["image/avif", "image/webp"] },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
