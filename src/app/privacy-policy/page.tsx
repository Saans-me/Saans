import type { Metadata } from "next";
import { LegalPage } from "@/components/pages/LegalPage";
import { pageMetadata } from "@/lib/seo";

// noindex until the real text replaces the placeholder: a thin legal page hurts trust on a health site.
export const metadata: Metadata = pageMetadata({
  path: "/privacy-policy",
  title: "Privacy policy · SAANS",
  description: "The SAANS privacy policy.",
  noindex: true,
});

export default function Page() {
  return (
    <main id="main" className="page-main">
      <LegalPage title="Privacy policy" screenLabel="Privacy policy" placeholder="[Privacy policy text]" />
    </main>
  );
}
