import type { Metadata } from "next";
import { JsonLd } from "@/components/shared/JsonLd";
import { organizationJsonLd, pageMetadata, webPageJsonLd, websiteJsonLd } from "@/lib/seo";
import { Hero } from "@/components/home/Hero";
import { Problem } from "@/components/home/Problem";
import { Solution } from "@/components/home/Solution";
import { Who } from "@/components/home/Who";
import { ForYou } from "@/components/home/ForYou";
import { Clinicians } from "@/components/home/Clinicians";
import { Colleges } from "@/components/home/Colleges";
import { PrivacyPreview } from "@/components/home/PrivacyPreview";
import { Next } from "@/components/home/Next";
import { Survey } from "@/components/home/Survey";
import { JoinCta } from "@/components/home/JoinCta";

const TITLE = "SAANS · Everyone deserves someone to talk to";
const DESCRIPTION =
  "SAANS listens any hour, by text or voice, in English, Hindi or Hinglish. It learns what helps you, and when you need more, connects you to a real professional.";

export const metadata: Metadata = pageMetadata({ path: "/", title: TITLE, description: DESCRIPTION });

export default function Home() {
  return (
    <main id="main">
      <JsonLd nodes={[organizationJsonLd(), websiteJsonLd(), webPageJsonLd("/", TITLE, DESCRIPTION)]} />
      <Hero />
      <Problem />
      <Solution />
      <Who />
      <ForYou />
      <Clinicians />
      <Colleges />
      <PrivacyPreview />
      <Next />
      <Survey />
      <JoinCta />
    </main>
  );
}
