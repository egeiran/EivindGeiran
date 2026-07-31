import type { Metadata } from "next";
import { JetBrains_Mono, Schibsted_Grotesk, Syne } from "next/font/google";
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
  title: "Eivind Geiran — Datateknologi, NTNU",
  description:
    "Datateknologi ved NTNU. Fem pågående roller, tre ting i produksjon, én ledig sommer.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="no">
      <body className={`${syne.variable} ${schibsted.variable} ${jetbrains.variable}`}>
        {children}
      </body>
    </html>
  );
}
