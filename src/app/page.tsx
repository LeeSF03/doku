import type { Metadata } from "next"

import { SITE_URL } from "@/lib/site"

import { HomeScreen } from "./_components/home-screen"

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Doku",
  description:
    "Doku is a browser-based document scanner for capturing, reviewing, saving, and exporting clean PDF scans.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    url: "/",
    title: "Doku",
    description:
      "Scan documents in your browser, organize drafts, and export clean PDFs.",
    siteName: "Doku",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Doku",
    description:
      "Scan documents in your browser, organize drafts, and export clean PDFs.",
  },
}

export default function Home() {
  return <HomeScreen />
}
