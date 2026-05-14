export const SITE_URL =
  process.env.NODE_ENV === "production"
    ? `https://${process.env.DEPLOY_PRIME_URL ?? process.env.DEPLOY_URL}`
    : process.env.NEXT_LOCAL_TESTING_URL || "http://localhost:3000"
