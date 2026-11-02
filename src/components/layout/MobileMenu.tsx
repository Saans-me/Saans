"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Icon } from "@/components/shared/Icon";
import { useModal } from "@/context/ModalContext";
import { useGoSection, useUI } from "@/context/UIContext";
import { prefersReducedMotion } from "@/hooks/useMediaQuery";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { ThemeToggle } from "./ThemeToggle";
import styles from "./Header.module.css";

const SECTIONS = [
  { id: "for-you", label: "For you" },
  { id: "clinicians", label: "For clinicians" },
  { id: "colleges", label: "For colleges" },
];
const LINKS = [
  { href: "/privacy", label: "Privacy" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
];

/** Full-screen sheet below the header pill (< 1080px). */
export function MobileMenu() {
  const ref = useRef<HTMLDivElement>(null);
  const { setMenuOpen } = useUI();
  const { open } = useModal();
  const go = useGoSection();

  useFocusTrap(ref, true);

  useEffect(() => {
    const el = ref.current;
    if (el && !prefersReducedMotion()) {
      el.animate([{ opacity: 0, transform: "translateY(-12px)" }, { opacity: 1, transform: "none" }], {
        duration: 450,
        easing: "cubic-bezier(.22,1,.36,1)",
      });
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [setMenuOpen]);

  return (
    <div ref={ref} data-lenis-prevent role="dialog" aria-modal="true" aria-label="Menu" className={styles.menu}>
      <nav aria-label="Mobile" className={styles.menuNav}>
        {SECTIONS.map((s) => (
          <Link key={s.id} href={`/#${s.id}`} onClick={go(s.id)} className={styles.menuLink}>
            {s.label}
            <Icon name="arrow" size={20} />
          </Link>
        ))}
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className={styles.menuLink} onClick={() => setMenuOpen(false)}>
            {l.label}
            <Icon name="arrow" size={20} />
          </Link>
        ))}
      </nav>
      <div className={styles.menuTheme}>
        <span>Theme</span>
        <ThemeToggle />
      </div>
      <div className={styles.menuFoot}>
        <button type="button" onClick={() => open("waitlist")} className="btn btn-primary btn-block">
          Join the waitlist
        </button>
      </div>
    </div>
  );
}
