"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { ArrowRight, ChatDock, HeartPlus, Lock, Users } from "./icons";
import { useUI } from "./UIProvider";
import s from "./MobileDock.module.css";

const TABS: [string, string, ReactNode][] = [
  ["how", "What", <ChatDock key="i" size={20} sw={1.9} />],
  ["for", "For you", <Users key="i" size={20} sw={1.9} />],
  ["care", "Care", <HeartPlus key="i" size={20} sw={1.9} />],
  ["privacy", "Privacy", <Lock key="i" size={20} sw={1.9} />],
];

/** Floating bottom tab bar for screens under 1000px. Slides up once the hero is scrolled past. */
export function MobileDock() {
  const { open, goTo, active, menuOpen } = useUI();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(scrollY > 320);
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => removeEventListener("scroll", onScroll);
  }, []);

  const shown = scrolled && !menuOpen;

  return (
    <>
      <div aria-hidden="true" className={s.spacer} />
      <nav aria-label="Sections" className={s.dock} data-shown={shown || undefined}>
        {TABS.map(([id, label, icon]) => (
          <a key={id} href={`#${id}`} onClick={e => goTo(e, id)} aria-current={active === id ? "location" : "false"} className={s.tab}>
            {icon}{label}
          </a>
        ))}
        <button type="button" onClick={e => open("coming", e)} className={s.talk}>
          Talk<ArrowRight size={16} sw={2.2} />
        </button>
      </nav>
    </>
  );
}
