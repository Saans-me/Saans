import type { Metadata } from "next";
import { HelpPage } from "@/components/pages/HelpPage";

export const metadata: Metadata = {
  title: "Get help now · SAANS",
  description:
    "You don't have to do this alone. If you're in danger right now, call your local emergency number. These lines are free, confidential and staffed by people who care.",
  alternates: { canonical: "/help" },
};

export default function Page() {
  return (
    <main id="main" className="page-main">
      <HelpPage />
    </main>
  );
}
