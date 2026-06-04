import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import { ProfileProvider } from "@/components/ProfileContext";
import { PhaseProvider } from "@/components/PhaseContext";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import QuickActionsFAB from "@/components/QuickActionsFAB";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kyelos",
  description: "Every day. On purpose.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Kyelos",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#1F2D24",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable}`}>
      <body>
        <ProfileProvider>
          <PhaseProvider>
            <ServiceWorkerRegister />
            <Nav />
            <main className="max-w-2xl mx-auto px-4 pb-24 pt-4 safe-padding">
              {children}
            </main>
            <QuickActionsFAB />
          </PhaseProvider>
        </ProfileProvider>
      </body>
    </html>
  );
}
