"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { Logo } from "@/components/shared/Logo";
import { Icon } from "@/components/shared/Icon";
import { useModal } from "@/context/ModalContext";
import { useGoSection, useUI } from "@/context/UIContext";
import { ThemeToggle } from "./ThemeToggle";
import { MobileMenu } from "./MobileMenu";
import styles from "./Header.module.css";

/** Home sections (scroll) */
export const NAV_SECTIONS = [
  { id: "for-you", label: "For you" },
  { id: "clinicians", label: "For clinicians" },
  { id: "colleges", label: "For colleges" },
];
/** Pages */
export const NAV = [
  { href: "/privacy", label: "Privacy" },
  { href: "/about", label: "About" },
];

export function Header() {
  const pathname = usePathname();
  const { open } = useModal();
  const { menuOpen, setMenuOpen } = useUI();
  const go = useGoSection();
  const isHome = pathname === "/";

  // Close the menu on navigation.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname, setMenuOpen]);

  return (
    <>
      <header className={`${styles.header} ${isHome ? styles.onHome : ""}`}>
        <div data-intro="header" className={styles.pill}>
          <div className={styles.logo}>
            <Logo />
          </div>

          <nav aria-label="Main" className={styles.nav}>
            {NAV_SECTIONS.map((n) => (
              <Link key={n.id} href={`/#${n.id}`} onClick={go(n.id)} className={styles.navLink}>
                {n.label}
              </Link>
            ))}
            {NAV.map((n) => {
              const cur = pathname === n.href;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={cur ? "page" : undefined}
                  className={`${styles.navLink} ${cur ? styles.navCur : ""}`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <div className={styles.right}>
            <ThemeToggle className={styles.wideOnly} />
            <button type="button" onClick={() => open("help")} className={styles.helpBtn}>
              <span aria-hidden="true" className={styles.dot} />
              Get help
            </button>
            <button type="button" onClick={() => open("waitlist")} className={`${styles.joinBtn} ${styles.wideOnly}`}>
              Join the waitlist
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen((m) => !m)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              className={`${styles.iconBtn} ${styles.narrowOnly}`}
            >
              <Icon name={menuOpen ? "close" : "menu"} size={20} />
            </button>
          </div>
        </div>
      </header>
      {menuOpen && <MobileMenu />}
    </>
  );
}
