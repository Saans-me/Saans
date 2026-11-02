import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "SAANS · Everyone deserves someone to talk to",
};

export default function Home() {
  return (
    <main id="main">
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
