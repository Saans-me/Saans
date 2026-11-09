import type { MetadataRoute } from "next";
import { CONTENT_UPDATED, SITE_URL } from "@/lib/seo";

// Only pages worth indexing. /privacy-policy and /terms return once their real text replaces the placeholder.
export default function sitemap(): MetadataRoute.Sitemap {
  return Object.entries(CONTENT_UPDATED).map(([path, updated]) => ({
    url: `${SITE_URL}${path === "/" ? "" : path}`,
    // Google and Bing read lastmod (when it is accurate) and ignore priority and changefreq.
    lastModified: updated,
  }));
}
