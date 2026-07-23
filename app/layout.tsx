import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { SITE_NAME, SITE_URL } from "@/lib/seo/metadata";
import { GoogleAnalytics } from "@/lib/analytics/gtag";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Indoor Golf in Linton, Indiana`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "State-of-the-art golf simulators, lessons, leagues, youth programs and community events in Linton, Indiana. Opening Fall 2026.",
  openGraph: {
    siteName: SITE_NAME,
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="min-h-screen font-sans">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        {children}
        <GoogleAnalytics />
      </body>
    </html>
  );
}
