import type { Metadata } from "next";
import { FaqPage } from "@/components/pages/FaqPage";

export const metadata: Metadata = {
  title: "FAQ · SAANS",
  description:
    "Questions about SAANS: what it is, when you can use it, which languages it speaks, who can see your conversations, and what happens in a crisis.",
  alternates: { canonical: "/faq" },
};

export default function Page() {
  return (
    <main id="main" className="page-main">
      <FaqPage />
    </main>
  );
}
