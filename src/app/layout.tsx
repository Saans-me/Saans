import type { Metadata, Viewport } from "next";
import { Comfortaa, Manrope } from "next/font/google";
import { Providers } from "@/components/layout/Providers";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ModalShell } from "@/components/modals/ModalShell";
import { themeBootstrapScript } from "@/context/ThemeContext";
import "lenis/dist/lenis.css";
import { ORG_DESCRIPTION, SITE_URL } from "@/lib/seo";
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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "SAANS · Everyone deserves someone to talk to",
    template: "%s",
  },
  description: ORG_DESCRIPTION,
  applicationName: "SAANS",
  // Pages set their own title, description, canonical and social cards through pageMetadata() in lib/seo.ts.
  openGraph: { type: "website", siteName: "SAANS", locale: "en_IN" },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
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
    <html lang="en-IN" data-theme="dark" suppressHydrationWarning className={`${comfortaa.variable} ${manrope.variable}`}>
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
