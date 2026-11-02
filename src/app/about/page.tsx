import type { Metadata } from "next";
import { AboutPage } from "@/components/pages/AboutPage";

export const metadata: Metadata = {
  title: "About SAANS",
  description:
    "Built for the moments in between. Most hard moments don't happen in a therapist's office. They happen at 2 AM, the night before an exam, on the walk home.",
  alternates: { canonical: "/about" },
};

export default function Page() {
  return (
    <main id="main" className="page-main">
      <AboutPage />
    </main>
  );
}
