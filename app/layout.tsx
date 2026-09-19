import type { Metadata, Viewport } from "next";
import { Archivo_Black, DM_Sans, Newsreader } from "next/font/google";
import "./globals.css";

const display = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display-g",
});

const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans-g",
});

const serif = Newsreader({
  subsets: ["latin"],
  variable: "--font-serif-g",
});

export const metadata: Metadata = {
  title: "MLB Live — Crazy Stats",
  description:
    "Tap a player. We pull live MLB numbers. Then we find the stat that shouldn't be real.",
  applicationName: "MLB Crazy Stats",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Crazy Stats",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#070b12",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${serif.variable}`}>
      <body>
        <div className="app">{children}</div>
      </body>
    </html>
  );
}
