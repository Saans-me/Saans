import type { Metadata } from "next";
import { AboutPage, TEAM } from "@/components/pages/AboutPage";
import { JsonLd } from "@/components/shared/JsonLd";
import { breadcrumbJsonLd, organizationJsonLd, pageMetadata, SITE_URL, webPageJsonLd } from "@/lib/seo";

const TITLE = "About SAANS · Who we are and why we built it";
const DESCRIPTION =
  "Built for the moments in between. Most hard moments don't happen in a therapist's office. They happen at 2 AM, the night before an exam, on the walk home.";

export const metadata: Metadata = pageMetadata({ path: "/about", title: TITLE, description: DESCRIPTION });

export default function Page() {
  const founders = TEAM.map((m) => ({
    "@type": "Person",
    name: m.name,
    jobTitle: m.role,
    image: `${SITE_URL}${m.photo}`,
  }));
  return (
    <main id="main" className="page-main">
      <JsonLd
        nodes={[
          webPageJsonLd("/about", TITLE, DESCRIPTION, "AboutPage", { mainEntity: { "@id": `${SITE_URL}/#organization` } }),
          { ...organizationJsonLd(), founder: founders },
          breadcrumbJsonLd("/about", "About"),
        ]}
      />
      <AboutPage />
    </main>
  );
}
