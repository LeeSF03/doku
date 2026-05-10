"use client"

import { type Route } from "next"
import { useRouter } from "next/navigation"

import { RotateCcw, X, Zap, ZapOff } from "lucide-react"
import { useQueryState } from "nuqs"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

import { type CameraPreviewState } from "../_hooks/use-camera-preview"

export function ScanHeader({
  flashEnabled,
  flashSupported,
  previewState,
  toggleFlash,
}: {
  flashEnabled: boolean
  flashSupported: boolean
  previewState: CameraPreviewState
  toggleFlash: () => Promise<void>
}) {
  const router = useRouter()
  const [replacePageId] = useQueryState("replace-page-id")
  const flashDisabled = previewState !== "ready" || !flashSupported

  const reviewHref = replacePageId
    ? (`/scan/review?draft-page-id=${encodeURIComponent(replacePageId)}` as Route)
    : null

  const handleCloseScanner = () => {
    if (reviewHref) {
      router.replace(reviewHref)
      return
    }

    router.push("/")
  }

  const handleToggleFlash = async () => {
    try {
      await toggleFlash()
    } catch (error) {
      toast.error("Could not toggle flash", {
        description:
          error instanceof Error ? error.message : "Try again in a moment.",
      })
    }
  }

  return (
    <div className="flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),1rem)] pb-3">
      <Button
        variant="ghost"
        size="icon"
        onClick={handleCloseScanner}
        aria-label={reviewHref ? "Cancel retake" : "Close scanner"}
        className="rounded-full text-white hover:bg-white/10 hover:text-white"
      >
        <X />
      </Button>

      {replacePageId && (
        <div className="flex h-8 items-center gap-1.5 rounded-full bg-white/10 px-3 text-xs font-medium text-white">
          <RotateCcw className="size-3.5" />
          Retake
        </div>
      )}

      <Button
        variant="ghost"
        size="icon"
        onClick={handleToggleFlash}
        disabled={flashDisabled}
        aria-label={flashEnabled ? "Disable flash" : "Enable flash"}
        className="disabled:text-muted-foreground/50 rounded-full text-white hover:bg-white/10 hover:text-white disabled:opacity-100"
      >
        {flashEnabled ? (
          <Zap className="fill-yellow-300 text-yellow-300" />
        ) : (
          <ZapOff />
        )}
      </Button>
    </div>
  )
}
