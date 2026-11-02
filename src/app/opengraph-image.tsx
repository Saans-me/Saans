import { ImageResponse } from "next/og";

// README §13: 1200×630 with the logo and the headline.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "SAANS · Everyone deserves someone to talk to.";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "radial-gradient(120% 80% at 50% 100%, #2A2150 0%, #15112A 60%)",
          color: "#F0EDFA",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="54" height="59" viewBox="0 0 1872 2048">
            <path d="M0 1002V695C0 403.5 234.5 165 670 165H1322V472C1322 763.5 1087.5 1002 652 1002Z" fill="#F0EDFA" />
            <path d="M220 2048V1741C220 1449.5 454.5 1211 890 1211H1542V1518C1542 1809.5 1307.5 2048 872 2048Z" fill="#B9B0D9" />
            <circle cx="1701" cy="170" r="165" fill="#FF5E00" />
          </svg>
          <span style={{ fontSize: 46, fontWeight: 700, letterSpacing: "-0.02em" }}>saans</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <span style={{ fontSize: 82, fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.04em", maxWidth: 900 }}>
            Everyone deserves someone to talk to.
          </span>
          <span style={{ fontSize: 30, color: "#B6AFD0" }}>
            An AI companion that knows when to bring in a human.
          </span>
        </div>
      </div>
    ),
    size,
  );
}
