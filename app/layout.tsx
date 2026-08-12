import type { Metadata } from "next";
import { JetBrains_Mono, Schibsted_Grotesk, Syne } from "next/font/google";
import { HOME_DESCRIPTION, HOME_TITLE } from "@/lib/meta";
import { PERSON, SITE_URL } from "@/lib/site";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-display",
});

const schibsted = Schibsted_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-body",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // Tittelen starter med navnet: det er søket siden skal vinne. Sidene setter
  // sin egen absolutte tittel; malen gjelder eventuelle framtidige undersider.
  title: {
    default: HOME_TITLE.no,
    template: "%s | Eivind Geiran",
  },
  description: HOME_DESCRIPTION.no,
  applicationName: "Eivind Geiran",
  authors: [{ name: PERSON.fullName, url: SITE_URL }],
  creator: PERSON.fullName,
  publisher: PERSON.fullName,
  keywords: [
    "Eivind Geiran",
    "Eivind Systad Geiran",
    "Geiran",
    "datateknologi NTNU",
    "NTNU Trondheim",
    "portefølje",
    "CV",
    "utvikler",
    "Kort Forklart",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  // Standardverdier; hver side setter sin egen canonical, hreflang og tittel.
  openGraph: {
    type: "profile",
    firstName: "Eivind",
    lastName: "Geiran",
    locale: "no_NO",
    alternateLocale: ["en_US"],
    url: SITE_URL,
    siteName: "Eivind Geiran",
    title: HOME_TITLE.no,
    description: HOME_DESCRIPTION.no,
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_TITLE.no,
    description: HOME_DESCRIPTION.no,
  },
  category: "portfolio",
};

// `lang` settes til nb her og overstyres på de engelske rutene, som pakker
// innholdet sitt i et element med lang="en". Se app/en/layout.tsx.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nb">
      <body className={`${syne.variable} ${schibsted.variable} ${jetbrains.variable}`}>
        {children}
      </body>
    </html>
  );
}
