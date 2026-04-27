import { connection } from "next/server";
import { ScanScreen } from "./_components/scan-screen";

export default async function ScanPage() {
  await connection();

  return <ScanScreen />;
}
