import type { CSSProperties, ReactNode } from "react";

type IconProps = { size?: number; sw?: number; className?: string; style?: CSSProperties };

function Svg({ size = 18, sw = 2, className, style, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      style={style}
    >
      {children}
    </svg>
  );
}

export const ArrowRight = (p: IconProps) => <Svg {...p}><path d="M5 12h13M13 6l6 6-6 6" /></Svg>;
export const ArrowLeft = (p: IconProps) => <Svg {...p}><path d="M15 6l-6 6 6 6" /></Svg>;
export const Close = (p: IconProps) => <Svg {...p}><path d="M6 6l12 12M18 6L6 18" /></Svg>;
export const Check = (p: IconProps) => <Svg {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></Svg>;
export const Mic = (p: IconProps) => (
  <Svg {...p}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" /></Svg>
);
export const Search = (p: IconProps) => <Svg {...p}><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4-4" /></Svg>;
export const Video = (p: IconProps) => (
  <Svg {...p}><rect x="3" y="6" width="13" height="12" rx="3" /><path d="M16 10.5l5-3v9l-5-3" /></Svg>
);
export const Lock = (p: IconProps) => (
  <Svg {...p}><rect x="5" y="11" width="14" height="9" rx="3" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></Svg>
);
export const Toggle = (p: IconProps) => (
  <Svg {...p}><rect x="3" y="7.5" width="18" height="9" rx="4.5" /><circle cx="16.5" cy="12" r="2.2" /></Svg>
);
export const Chat = (p: IconProps) => (
  <Svg {...p}><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H10l-4 4v-4A2 2 0 0 1 4 14z" /></Svg>
);
export const ChatDock = (p: IconProps) => (
  <Svg {...p}><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H10l-4 4v-4.2A2.5 2.5 0 0 1 4 13.5z" /></Svg>
);
export const Users = (p: IconProps) => (
  <Svg {...p}><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 5.2a3 3 0 0 1 0 5.6M17.5 14a5 5 0 0 1 3 5" /></Svg>
);
export const Heart = (p: IconProps) => (
  <Svg {...p}><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></Svg>
);
export const HeartPlus = (p: IconProps) => (
  <Svg {...p}><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /><path d="M12 9v5M9.5 11.5h5" /></Svg>
);
export const HeartPulse = (p: IconProps) => (
  <Svg {...p}><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /><path d="M8.5 11.5h2l1-2 1.5 4 1-2h1.5" /></Svg>
);
export const Refresh = (p: IconProps) => <Svg {...p}><path d="M20 12a8 8 0 1 1-2.3-5.7" /><path d="M20 4v4h-4" /></Svg>;
export const Pill = (p: IconProps) => (
  <Svg {...p}><rect x="3.5" y="8.5" width="17" height="7" rx="3.5" transform="rotate(-45 12 12)" /><path d="M9.5 9.5l5 5" /></Svg>
);
export const Info = (p: IconProps) => <Svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 8h.01" /></Svg>;
export const Shield = (p: IconProps) => (
  <Svg {...p}><path d="M12 3l7 3v5.5c0 4.4-3 8-7 9.5-4-1.5-7-5.1-7-9.5V6z" /><path d="M9 12l2.2 2.2L15.5 10" /></Svg>
);
export const Sun = (p: IconProps) => (
  <Svg {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2.5 12h2M19.5 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></Svg>
);
export const Moon = (p: IconProps) => <Svg {...p}><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" /></Svg>;

const LEAF1 = "M50 129V102C50 68 80 53 110 53H170V82C170 114 140 129 112 129Z";
const LEAF2 = "M70 224V197C70 163 100 148 130 148H190V177C190 209 160 224 132 224Z";

/** The saans mark: two leaves and the orange dot. `mono` paints the leaves with currentColor. */
export function Logo({ width, height, mono, className, style }: { width?: number | string; height?: number | string; mono?: boolean; className?: string; style?: CSSProperties }) {
  return (
    <svg width={width} height={height} viewBox="50 38 170 186" aria-hidden="true" className={className} style={style}>
      <path d={LEAF1} style={{ fill: mono ? "currentColor" : "var(--leaf1)" }} />
      <path d={LEAF2} style={{ fill: mono ? "currentColor" : "var(--leaf2)" }} />
      <circle cx="204.5" cy="53.5" r="15" fill="#FF5E00" />
    </svg>
  );
}
