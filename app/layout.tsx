import type { Metadata } from "next";
import { JetBrains_Mono, Schibsted_Grotesk, Syne } from "next/font/google";
import { PERSON, SAME_AS, SITE_URL } from "@/lib/site";
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

const DESCRIPTION =
  "Eivind Geiran er datateknologistudent ved NTNU i Trondheim. Portefølje, " +
  "erfaring og prosjekter — Kort Forklart, NHL ML Prediction Model og tilbudsscraper.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // Tittelen starter med navnet: det er søket siden skal vinne.
  title: {
    default: "Eivind Geiran — datateknologi ved NTNU, Trondheim",
    template: "%s | Eivind Geiran",
  },
  description: DESCRIPTION,
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
  alternates: { canonical: "/" },
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
  openGraph: {
    type: "profile",
    firstName: "Eivind",
    lastName: "Geiran",
    locale: "no_NO",
    alternateLocale: ["en_US"],
    url: SITE_URL,
    siteName: "Eivind Geiran",
    title: "Eivind Geiran — datateknologi ved NTNU, Trondheim",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Eivind Geiran — datateknologi ved NTNU, Trondheim",
    description: DESCRIPTION,
  },
  category: "portfolio",
};

// Person- og WebSite-schema. Dette er den sterkeste enkeltfaktoren for at
// Google skal koble navnesøket «Eivind Geiran» til dette domenet: navnet,
// stedet, studiet og alle profilene beskrives som én entitet.
const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${SITE_URL}/#person`,
      name: PERSON.name,
      alternateName: PERSON.fullName,
      givenName: "Eivind",
      familyName: "Geiran",
      url: SITE_URL,
      email: `mailto:${PERSON.email}`,
      image: `${SITE_URL}/opengraph-image.png`,
      jobTitle: PERSON.jobTitle,
      description: DESCRIPTION,
      nationality: { "@type": "Country", name: PERSON.country },
      address: {
        "@type": "PostalAddress",
        addressLocality: PERSON.locality,
        addressCountry: "NO",
      },
      alumniOf: {
        "@type": "CollegeOrUniversity",
        name: "Norges teknisk-naturvitenskapelige universitet (NTNU)",
        url: "https://www.ntnu.no/",
      },
      knowsLanguage: ["nb-NO", "en"],
      knowsAbout: [
        "Datateknologi",
        "Programvareutvikling",
        "Maskinlæring",
        "TypeScript",
        "Python",
        "Next.js",
      ],
      sameAs: [...SAME_AS],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Eivind Geiran",
      inLanguage: "nb-NO",
      description: DESCRIPTION,
      publisher: { "@id": `${SITE_URL}/#person` },
      about: { "@id": `${SITE_URL}/#person` },
    },
    {
      "@type": "ProfilePage",
      "@id": `${SITE_URL}/#profilepage`,
      url: SITE_URL,
      name: "Eivind Geiran — datateknologi ved NTNU, Trondheim",
      isPartOf: { "@id": `${SITE_URL}/#website` },
      mainEntity: { "@id": `${SITE_URL}/#person` },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nb">
      <body className={`${syne.variable} ${schibsted.variable} ${jetbrains.variable}`}>
        {children}
        <script
          type="application/ld+json"
          // JSON_LD er en konstant i denne filen — ingen brukerdata inn hit.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
      </body>
    </html>
  );
}
