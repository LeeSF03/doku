import type { Metadata } from "next"
import { connection } from "next/server"

import { SITE_URL } from "@/lib/site"

import { ReviewScreen } from "./_components/review-screen"

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Review Scan | Doku",
  description:
    "Review, crop, organize, save, and export scanned documents with Doku.",
  alternates: {
    canonical: "/scan/review",
  },
  openGraph: {
    title: "Review Scan | Doku",
    description:
      "Review, crop, organize, save, and export scanned documents with Doku.",
    url: "/scan/review",
    siteName: "Doku",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Review Scan | Doku",
    description:
      "Review, crop, organize, save, and export scanned documents with Doku.",
  },
}

export default async function ReviewPage() {
  await connection()

  return <ReviewScreen />
}
