import type { Metadata, Viewport } from "next";
import { Archivo_Black, DM_Sans } from "next/font/google";
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

export const metadata: Metadata = {
  title: "MLB Live — Crazy Stats",
  description: "Tap a player. Live MLB numbers. One insane stat.",
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
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body>
        <div className="app">{children}</div>
      </body>
    </html>
  );
}
