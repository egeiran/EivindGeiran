import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Admin — erfaringsdata",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Admin er kun tilgjengelig når DEV=1 (settes lokalt og på Vercel
  // preview-deployments). Uten flagget finnes ikke siden — 404.
  if (process.env.DEV !== "1") notFound();
  return children;
}
