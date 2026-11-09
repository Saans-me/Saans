import { jsonLdScript } from "@/lib/seo";

/** Structured data for search engines and AI answer engines. Render once per page, in the page body. */
export function JsonLd({ nodes }: { nodes: Record<string, unknown>[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(...nodes) }} />;
}
