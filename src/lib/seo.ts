// Facts search engines and AI answer engines read about SAANS: one place, so the page copy, the JSON-LD and
// llms.txt can't drift apart. Everything here must also be visible somewhere on the site.

import type { Metadata } from "next";
import { CONTACT_EMAIL, SOCIAL } from "@/lib/content";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://saans.me";

/** Bump when a page's content changes meaningfully; feeds sitemap lastmod. */
export const CONTENT_UPDATED: Record<string, string> = {
  "/": "2026-11-09",
  "/about": "2026-11-09",
  "/faq": "2026-11-09",
  "/privacy": "2026-11-09",
  "/help": "2026-11-09",
};

export const ORG_NAME = "SAANS";
export const ORG_DESCRIPTION =
  "SAANS is an AI companion for mental wellbeing. It listens any hour, by text or voice, in English, Hindi or Hinglish, learns what helps you, and connects you to a real psychologist or psychiatrist when you need more. It is not a medical or emergency service.";

const ORG_ID = `${SITE_URL}/#organization`;
const SITE_ID = `${SITE_URL}/#website`;

/** Real profile URLs only; placeholder "#" links are left out. */
export const SAME_AS = SOCIAL.map((s) => s.href).filter((h) => h.startsWith("http"));

type Json = Record<string, unknown>;

/**
 * Title, description, canonical and social cards for one page. Next merges `openGraph` shallowly, so each page
 * sets the whole object; the image comes from src/app/opengraph-image.tsx.
 */
export function pageMetadata({
  path,
  title,
  description,
  noindex = false,
}: {
  path: string;
  title: string;
  description: string;
  noindex?: boolean;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: ORG_NAME,
      locale: "en_IN",
      url: path,
      title,
      description,
    },
    twitter: { card: "summary_large_image", title, description },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

export function organizationJsonLd(): Json {
  return {
    "@type": "Organization",
    "@id": ORG_ID,
    name: ORG_NAME,
    url: SITE_URL,
    logo: { "@type": "ImageObject", url: `${SITE_URL}/icon.svg` },
    description: ORG_DESCRIPTION,
    email: CONTACT_EMAIL,
    contactPoint: [{ "@type": "ContactPoint", contactType: "customer support", email: CONTACT_EMAIL }],
    areaServed: "IN",
    knowsLanguage: ["en", "hi"],
    ...(SAME_AS.length ? { sameAs: SAME_AS } : {}),
  };
}

export function websiteJsonLd(): Json {
  return {
    "@type": "WebSite",
    "@id": SITE_ID,
    name: ORG_NAME,
    alternateName: ["Saans", "saans.me"],
    url: SITE_URL,
    inLanguage: "en-IN",
    publisher: { "@id": ORG_ID },
  };
}

export function webPageJsonLd(
  path: string,
  name: string,
  description: string,
  type: "WebPage" | "AboutPage" | "FAQPage" | "ContactPage" = "WebPage",
  extra: Json = {},
): Json {
  const url = `${SITE_URL}${path === "/" ? "" : path}`;
  return {
    "@type": type,
    "@id": `${url}#webpage`,
    url,
    name,
    description,
    inLanguage: "en-IN",
    isPartOf: { "@id": SITE_ID },
    about: { "@id": ORG_ID },
    ...(CONTENT_UPDATED[path] ? { dateModified: CONTENT_UPDATED[path] } : {}),
    ...extra,
  };
}

export function faqJsonLd(items: [string, string][]): Json {
  return {
    mainEntity: items.map(([q, a]) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}

export function breadcrumbJsonLd(path: string, name: string): Json {
  return {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name, item: `${SITE_URL}${path}` },
    ],
  };
}

/** One <script type="application/ld+json"> with an @graph. `<` is escaped so page data can't close the tag. */
export function jsonLdScript(...nodes: Json[]): string {
  return JSON.stringify({ "@context": "https://schema.org", "@graph": nodes }).replace(/</g, "\\u003c");
}
