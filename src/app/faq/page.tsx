import type { Metadata } from "next";
import { FaqPage } from "@/components/pages/FaqPage";
import { JsonLd } from "@/components/shared/JsonLd";
import { FAQ } from "@/lib/content";
import { breadcrumbJsonLd, faqJsonLd, pageMetadata, webPageJsonLd } from "@/lib/seo";

const TITLE = "SAANS FAQ · Is it a therapist, which languages, who sees my chats";
const DESCRIPTION =
  "Questions about SAANS: what it is, when you can use it, which languages it speaks, who can see your conversations, and what happens in a crisis.";

export const metadata: Metadata = pageMetadata({ path: "/faq", title: TITLE, description: DESCRIPTION });

export default function Page() {
  return (
    <main id="main" className="page-main">
      <JsonLd
        nodes={[webPageJsonLd("/faq", TITLE, DESCRIPTION, "FAQPage", faqJsonLd(FAQ)), breadcrumbJsonLd("/faq", "FAQ")]}
      />
      <FaqPage />
    </main>
  );
}
