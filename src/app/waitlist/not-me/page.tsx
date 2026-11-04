import type { Metadata } from "next";
import { NotMeWaitlist } from "@/components/pages/NotMeWaitlist";

export const metadata: Metadata = {
  title: "Remove your address · SAANS",
  description: "Remove your address from the SAANS waitlist.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <main id="main" className="page-main">
      <NotMeWaitlist />
    </main>
  );
}
