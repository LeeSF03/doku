import type { Metadata } from "next"
import { connection } from "next/server"

import { ScanScreen } from "./_components/scan-screen"

export const metadata: Metadata = {
  title: "Scan Document | Doku",
  description: "Capture document scans directly in your browser with Doku.",
  alternates: {
    canonical: "/scan",
  },
  openGraph: {
    title: "Scan Document | Doku",
    description: "Capture document scans directly in your browser with Doku.",
    url: "/scan",
    siteName: "Doku",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Scan Document | Doku",
    description: "Capture document scans directly in your browser with Doku.",
  },
}

export default async function ScanPage() {
  await connection()

  return <ScanScreen />
}
