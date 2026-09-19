import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import { AppHeader } from "@/components/AppHeader";
import "./globals.css";

const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans-g",
});

export const metadata: Metadata = {
  title: "MLB",
  description: "Tap a game, then a player. Live numbers and a fact.",
  applicationName: "MLB",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "MLB",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

const themeBoot = `(function(){try{var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"}document.documentElement.setAttribute("data-theme",t)}catch(e){document.documentElement.setAttribute("data-theme","dark")}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={sans.variable} suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
        <div className="app">
          <AppHeader />
          {children}
        </div>
      </body>
    </html>
  );
}
