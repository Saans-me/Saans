import type { Metadata } from "next";
import { LegalPage } from "@/components/pages/LegalPage";
import { pageMetadata } from "@/lib/seo";

// noindex until the real text replaces the placeholder: a thin legal page hurts trust on a health site.
export const metadata: Metadata = pageMetadata({
  path: "/terms",
  title: "Terms · SAANS",
  description: "The SAANS terms of use.",
  noindex: true,
});

export default function Page() {
  return (
    <main id="main" className="page-main">
      <LegalPage title="Terms" screenLabel="Terms" placeholder="[Terms text]" />
    </main>
  );
}
