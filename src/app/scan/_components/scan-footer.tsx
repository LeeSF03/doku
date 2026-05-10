import { useState } from "react"

import Link from "next/link"
import { useRouter } from "next/navigation"

import { Images } from "lucide-react"
import { useQueryState } from "nuqs"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

import {
  ACTIVE_SCAN_DRAFT_ID,
  saveScanDraftPage,
} from "../_lib/scan-drafts-db"
import { type CameraPreviewState } from "../_hooks/use-camera-preview"
import {
  type ScanDraftPage,
  useScanDraftActions,
  useScanDraftStore,
} from "../_providers/scan-provider"

export function ScanFooter({
  captureFrame,
  previewState,
}: {
  captureFrame: () => Promise<Blob>
  previewState: CameraPreviewState
}) {
  const router = useRouter()
  const [replacePageId] = useQueryState("replace-page-id")
  const [capturePending, setCapturePending] = useState(false)
  const pages = useScanDraftStore((state) => state.pages)
  const pageCount = pages.length
  const { upsertPage } = useScanDraftActions()

  const handleCapture = async () => {
    setCapturePending(true)

    try {
      const blob = await captureFrame()
      const imageUrl = URL.createObjectURL(blob)
      const page: ScanDraftPage = {
        id: replacePageId ?? crypto.randomUUID(),
        imageUrl,
        rotation: 0,
        filter: "original" as const,
      }
      const pageOrder = replacePageId
        ? pages.findIndex((draftPage) => draftPage.id === replacePageId)
        : pages.length

      upsertPage(page)
      await saveScanDraftPage(ACTIVE_SCAN_DRAFT_ID, {
        id: page.id,
        imageBlob: blob,
        order: pageOrder < 0 ? pages.length : pageOrder,
        rotation: page.rotation,
        filter: page.filter,
      })
      router.push(`/scan/review?draft-page-id=${encodeURIComponent(page.id)}`)
    } catch (error) {
      toast.error("Could not capture page", {
        description:
          error instanceof Error ? error.message : "Try again in a moment.",
      })
    } finally {
      setCapturePending(false)
    }
  }

  const canOpenReview = pageCount > 0

  return (
    <div className="grid grid-cols-3 items-center">
      <div className="flex justify-start">
        {canOpenReview ? (
          <Button
            asChild
            variant="ghost"
            size="icon-lg"
            aria-label="Open review"
            className="rounded-xl text-white hover:bg-white/10 hover:text-white"
          >
            <Link href="/scan/review">
              <Images className="size-6" />
            </Link>
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            disabled
            aria-label="Open review"
            className="text-muted-foreground/50 rounded-xl disabled:opacity-100"
          >
            <Images className="size-6" />
          </Button>
        )}
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={handleCapture}
          disabled={previewState !== "ready" || capturePending}
          aria-label="Capture"
          className="group relative grid size-20 place-items-center rounded-full transition-opacity outline-none focus-visible:ring-4 focus-visible:ring-white/30 disabled:pointer-events-none disabled:opacity-50"
        >
          <span className="absolute inset-0 rounded-full border-4 border-white" />
          <span className="size-15 rounded-full bg-white transition-transform group-active:scale-90" />
        </button>
      </div>

      <div className="flex justify-end">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl text-xs font-medium text-white/80">
          {pageCount}
        </div>
      </div>
    </div>
  )
}
