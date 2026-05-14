import type { MetadataRoute } from "next"

import { SITE_URL } from "@/lib/site"

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: SITE_URL,
    name: "Doku Document Scanner",
    short_name: "Doku",
    description:
      "Scan, review, organize, save, and export clean PDF documents in your browser.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      {
        src: "/logo.png",
        sizes: "any",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logo.png",
        sizes: "any",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  }
}
