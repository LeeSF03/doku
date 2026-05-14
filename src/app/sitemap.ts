import type { MetadataRoute } from "next"

import { SITE_URL } from "@/lib/site"

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  return [
    {
      url: new URL("/", SITE_URL).toString(),
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: new URL("/scan", SITE_URL).toString(),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: new URL("/scan/review", SITE_URL).toString(),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ]
}
