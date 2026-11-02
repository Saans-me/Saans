import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://saans.me";
const ROUTES = ["", "/privacy", "/help", "/about", "/faq", "/privacy-policy", "/terms"];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((r) => ({ url: `${SITE_URL}${r}`, changeFrequency: "monthly", priority: r === "" ? 1 : 0.7 }));
}
