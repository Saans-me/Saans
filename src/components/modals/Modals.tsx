"use client";

import { BreathModal } from "./BreathModal";
import { CareModal } from "./CareModal";
import { ComingSoonModal } from "./ComingSoonModal";
import { ForModal } from "./ForModal";
import { HelpModal } from "./HelpModal";
import { HowModal } from "./HowModal";
import { PrivacyModal } from "./PrivacyModal";

/** All pop-ups. Each one renders nothing until it is opened through useUI().open(). */
export function Modals() {
  return (
    <>
      <BreathModal />
      <CareModal />
      <ForModal />
      <HowModal />
      <PrivacyModal />
      <ComingSoonModal />
      <HelpModal />
    </>
  );
}
