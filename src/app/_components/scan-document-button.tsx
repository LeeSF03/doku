"use client"

import Link from "next/link"

import { Camera } from "lucide-react"

import { Button } from "@/components/ui/button"

export function ScanDocumentButton() {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 flex justify-center px-5 pb-[max(env(safe-area-inset-bottom),1.25rem)]">
      <Button
        asChild
        size="lg"
        className="pointer-events-auto h-14 w-full max-w-md gap-2 rounded-full text-base shadow-lg"
      >
        <Link href="/scan">
          <Camera className="size-5" />
          Scan Document
        </Link>
      </Button>
    </div>
  )
}
