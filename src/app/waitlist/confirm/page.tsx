import type { Metadata } from "next";
import { ConfirmWaitlist } from "@/components/pages/ConfirmWaitlist";

export const metadata: Metadata = {
  title: "Confirm your spot · SAANS",
  description: "Confirm your spot on the SAANS waitlist.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <main id="main" className="page-main">
      <ConfirmWaitlist />
    </main>
  );
}
