import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// Everything public is open to search engines and AI answer engines, so SAANS can be found and cited
// (Googlebot, Bingbot, OAI-SearchBot, ChatGPT-User, Claude-SearchBot, PerplexityBot, Applebot, Meta-WebIndexer…).
// Training crawlers (GPTBot, ClaudeBot, Google-Extended, CCBot…) are allowed too: this is public marketing copy, and
// Google-Extended also feeds Gemini's grounded answers. Bytespider is blocked: no search or citation benefit.
// Waitlist confirm pages are not blocked here on purpose: they carry noindex, which crawlers must fetch to see.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: "/api/" },
      { userAgent: "Bytespider", disallow: "/" },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
