"use client";

import Link from "next/link";
import { useModal, type ModalName } from "@/context/ModalContext";
import { useGoSection } from "@/context/UIContext";
import { track } from "@/lib/analytics";
import { SURVEY_URL } from "@/lib/content";

/**
 * Client islands so server components can trigger popups / tracked links.
 * Usage: <ModalButton modal="waitlist" className="btn btn-primary">Join the waitlist</ModalButton>
 */
export function ModalButton({
  modal,
  children,
  className,
  style,
  asLink,
  ...rest
}: {
  modal: ModalName;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /** Render as <a href="#"> (reference uses links for some triggers). */
  asLink?: boolean;
} & Omit<React.HTMLAttributes<HTMLElement>, "onClick">) {
  const { open } = useModal();
  if (asLink) {
    return (
      <a
        href="#"
        className={className}
        style={style}
        onClick={(e) => {
          e.preventDefault();
          open(modal);
        }}
        {...rest}
      >
        {children}
      </a>
    );
  }
  return (
    <button type="button" className={className} style={style} onClick={() => open(modal)} {...rest}>
      {children}
    </button>
  );
}

/** Link to a home section (optionally selecting a For-you tab). Works from any page. */
export function SectionLink({
  id,
  tab,
  children,
  className,
  style,
}: {
  id: string;
  tab?: number;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const go = useGoSection();
  return (
    <Link href={`/#${id}`} className={className} style={style} onClick={go(id, tab)}>
      {children}
    </Link>
  );
}

/** Google Form survey link (new tab) that fires `survey_click`. */
export function SurveyLink({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <a
      href={SURVEY_URL}
      target="_blank"
      rel="noopener"
      className={className}
      style={style}
      onClick={() => track("survey_click")}
    >
      {children}
    </a>
  );
}
