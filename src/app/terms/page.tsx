import type { Metadata } from "next";
import { LegalPage } from "@/components/pages/LegalPage";

export const metadata: Metadata = {
  title: "Terms · SAANS",
  description: "The SAANS terms of use.",
  alternates: { canonical: "/terms" },
};

export default function Page() {
  return (
    <main id="main" className="page-main">
      <LegalPage title="Terms" screenLabel="Terms" placeholder="[Terms text]" />
    </main>
  );
}
