import type { Metadata, Viewport } from "next";
import { Manrope, Inter } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import { ProfileProvider } from "@/components/ProfileContext";
import { PhaseProvider } from "@/components/PhaseContext";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

const manrope = Manrope({
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
  title: "Tandem",
  description: "Athletic. Together. — A personal training companion.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Tandem",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#9DAA92",
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
    <html lang="en" className={`${manrope.variable} ${inter.variable}`}>
      <body>
        <ProfileProvider>
          <PhaseProvider>
            <ServiceWorkerRegister />
            <Nav />
            <main className="max-w-2xl mx-auto px-4 pb-24 pt-4 safe-padding">
              {children}
            </main>
          </PhaseProvider>
        </ProfileProvider>
      </body>
    </html>
  );
}
