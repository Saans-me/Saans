import type { Metadata } from "next";
import { PrivacyPage } from "@/components/privacy/PrivacyPage";

export const metadata: Metadata = {
  title: "Privacy and safety · SAANS",
  description:
    "Private by design. Honest about limits. What you share with SAANS is yours: what we collect and why, who sees what, and our promises.",
  alternates: { canonical: "/privacy" },
};

export default function Page() {
  return (
    <main id="main" className="page-main">
      <PrivacyPage />
    </main>
  );
}
