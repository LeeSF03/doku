export const SITE_URL =
  process.env.NODE_ENV === "production"
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL}`
    : process.env.NEXT_LOCAL_TESTING_URL || "http://localhost:3000"
