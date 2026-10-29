import { BreathCTA } from "@/components/BreathCTA";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Journey } from "@/components/Journey";
import { MobileDock } from "@/components/MobileDock";
import { Modals } from "@/components/modals/Modals";
import { Motion } from "@/components/Motion";
import { Privacy } from "@/components/Privacy";
import { ProfessionalCare } from "@/components/ProfessionalCare";
import { Story } from "@/components/Story";
import { UIProvider } from "@/components/UIProvider";
import { WhatItDoes } from "@/components/WhatItDoes";
import { WhoItsFor } from "@/components/WhoItsFor";

export default function Home() {
  return (
    <UIProvider>
      {/* #top carries the laptop zoom rules (see globals.css) */}
      <div id="top" className="page" style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", overflowX: "clip" }}>
        <Header />
        <main>
          <Hero />
          <WhatItDoes />
          <WhoItsFor />
          <ProfessionalCare />
          <Journey />
          <Privacy />
          <Story />
          <BreathCTA />
        </main>
        <Footer />
        <MobileDock />
        <Modals />
      </div>
      <Motion />
    </UIProvider>
  );
}
