import Link from "next/link";

/** The SAANS leaf mark. Leaves theme via --leaf1/--leaf2; the dot is always #FF5E00. */
export function LogoMark({ width = 27, height = 30, className }: { width?: number; height?: number; className?: string }) {
  return (
    <svg width={width} height={height} viewBox="0 0 1872 2048" aria-hidden="true" className={className} style={{ flex: "none" }}>
      <path d="M0 1002V695C0 403.5 234.5 165 670 165H1322V472C1322 763.5 1087.5 1002 652 1002Z" style={{ fill: "var(--leaf1)" }} />
      <path d="M220 2048V1741C220 1449.5 454.5 1211 890 1211H1542V1518C1542 1809.5 1307.5 2048 872 2048Z" style={{ fill: "var(--leaf2)" }} />
      <circle cx="1701" cy="170" r="165" fill="#FF5E00" />
    </svg>
  );
}

/** Logo + "saans" wordmark, linking home. */
export function Logo({ letterSpacing = true, onClick }: { letterSpacing?: boolean; onClick?: () => void }) {
  return (
    <Link
      href="/"
      aria-label="SAANS home"
      onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "var(--text)" }}
    >
      <LogoMark />
      <span
        style={{
          fontFamily: "var(--font-head)",
          fontWeight: 700,
          fontSize: 23,
          letterSpacing: letterSpacing ? "-0.02em" : undefined,
        }}
      >
        saans
      </span>
    </Link>
  );
}
