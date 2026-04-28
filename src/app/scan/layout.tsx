import { ScanProvider } from "./_providers/scan-provider"

export default function ScanLayout({
  children,
}: {
  children: React.ReactNode
  params: Promise<Record<string, never>>
}) {
  return <ScanProvider>{children}</ScanProvider>
}
