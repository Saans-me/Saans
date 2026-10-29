"use client";

import { Logo } from "./icons";
import { useUI } from "./UIProvider";
import s from "./Footer.module.css";

const LINKS: [string, string][] = [
  ["how", "What it does"], ["for", "Who it's for"], ["care", "Professional care"], ["privacy", "Privacy"], ["story", "Our story"],
];

export function Footer() {
  const { open, goTo } = useUI();
  return (
    <footer className={s.footer}>
      <div className={s.top}>
        <a href="#top" onClick={e => goTo(e, "top")} aria-label="saans, back to top" className={s.brand}>
          <Logo width={24} height={26} />
          <span className={s.brandName}>saans</span>
        </a>
        <nav aria-label="Footer" className={s.links}>
          {LINKS.map(([id, label]) => (
            <a key={id} href={`#${id}`} onClick={e => goTo(e, id)} className={s.link}>{label}</a>
          ))}
        </nav>
        <button type="button" onClick={e => open("help", e)} className={s.help}>Get Help.</button>
      </div>
      <div className={s.bottom}>
        <span className={s.nowrap}>© 2026 saans</span>
        <span>saans is a supportive companion, not a medical or emergency service.</span>
      </div>
    </footer>
  );
}
