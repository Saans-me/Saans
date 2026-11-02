import type { Metadata } from "next";
import { LegalPage } from "@/components/pages/LegalPage";

export const metadata: Metadata = {
  title: "Privacy policy · SAANS",
  description: "The SAANS privacy policy.",
  alternates: { canonical: "/privacy-policy" },
};

export default function Page() {
  return (
    <main id="main" className="page-main">
      <LegalPage title="Privacy policy" screenLabel="Privacy policy" placeholder="[Privacy policy text]" />
    </main>
  );
}
