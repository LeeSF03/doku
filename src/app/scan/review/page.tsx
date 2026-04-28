import { connection } from "next/server"

import { ReviewScreen } from "./_components/review-screen"

export default async function ReviewPage() {
  await connection()

  return <ReviewScreen />
}
