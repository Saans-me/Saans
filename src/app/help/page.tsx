import type { Metadata } from "next";
import { HelpPage } from "@/components/pages/HelpPage";
import { JsonLd } from "@/components/shared/JsonLd";
import { breadcrumbJsonLd, pageMetadata, webPageJsonLd } from "@/lib/seo";

const TITLE = "Get help now · Free crisis helplines in India and abroad · SAANS";
const DESCRIPTION =
  "You don't have to do this alone. If you're in danger right now, call your local emergency number. These lines are free, confidential and staffed by people who care.";

export const metadata: Metadata = pageMetadata({ path: "/help", title: TITLE, description: DESCRIPTION });

export default function Page() {
  return (
    <main id="main" className="page-main">
      <JsonLd nodes={[webPageJsonLd("/help", TITLE, DESCRIPTION), breadcrumbJsonLd("/help", "Get help now")]} />
      <HelpPage />
    </main>
  );
}
