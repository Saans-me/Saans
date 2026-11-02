import type { Metadata, Viewport } from "next";
import { Comfortaa, Manrope } from "next/font/google";
import { Providers } from "@/components/layout/Providers";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ModalShell } from "@/components/modals/ModalShell";
import { themeBootstrapScript } from "@/context/ThemeContext";
import "lenis/dist/lenis.css";
import "./globals.css";

const comfortaa = Comfortaa({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
  variable: "--font-comfortaa",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-manrope",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://saans.me";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "SAANS · Everyone deserves someone to talk to",
    template: "%s",
  },
  description:
    "SAANS listens any hour, by text or voice, in English, Hindi or Hinglish. It learns what helps you, and when you need more, connects you to a real professional.",
  openGraph: {
    type: "website",
    siteName: "SAANS",
    title: "SAANS · Everyone deserves someone to talk to",
    description: "An AI companion that knows when to bring in a human.",
    // og:image comes from src/app/opengraph-image.tsx (1200×630).
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#15112A" },
    { media: "(prefers-color-scheme: light)", color: "#F7F5FC" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning className={`${comfortaa.variable} ${manrope.variable}`}>
      <head>
        {/* Sets data-theme before hydration so there is no flash of the wrong theme (README §4). */}
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body>
        <Providers>
          <div className="page" id="top">
            <a href="#main" className="skip-link">
              Skip to content
            </a>
            <Header />
            {children}
            <Footer />
          </div>
          <div className="scroll-progress" aria-hidden="true" />
          <ModalShell />
        </Providers>
      </body>
    </html>
  );
}
