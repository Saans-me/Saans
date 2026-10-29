import type { Metadata, Viewport } from "next";
import { Comfortaa } from "next/font/google";
import { themeBootstrap } from "@/hooks/useTheme";
import "./globals.css";

const comfortaa = Comfortaa({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-comfortaa",
});

export const metadata: Metadata = {
  title: "saans · Everyone deserves someone to talk to",
  description:
    "A caring companion that listens at any hour, by voice or text, in your language. And when you need more, a gentle path to qualified professionals.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" className={comfortaa.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
