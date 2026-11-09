import type { Metadata } from "next";
import { PrivacyPage } from "@/components/privacy/PrivacyPage";
import { JsonLd } from "@/components/shared/JsonLd";
import { breadcrumbJsonLd, pageMetadata, webPageJsonLd } from "@/lib/seo";

const TITLE = "Privacy and safety · What SAANS collects and who sees it";
const DESCRIPTION =
  "Private by design. Honest about limits. What you share with SAANS is yours: what we collect and why, who sees what, and our promises.";

export const metadata: Metadata = pageMetadata({ path: "/privacy", title: TITLE, description: DESCRIPTION });

export default function Page() {
  return (
    <main id="main" className="page-main">
      <JsonLd
        nodes={[webPageJsonLd("/privacy", TITLE, DESCRIPTION), breadcrumbJsonLd("/privacy", "Privacy and safety")]}
      />
      <PrivacyPage />
    </main>
  );
}
