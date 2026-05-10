import { type ReactNode } from "react"

import { cn } from "@/lib/utils"

import { type CameraPreviewState } from "../_hooks/use-camera-preview"

const messageByState = {
  loading: "Starting camera…",
  "permission-denied": "Allow camera access to scan documents.",
  ready: "Tap shutter to capture",
  unavailable: "Camera unavailable. Try again in a moment.",
  unsupported: "Camera preview is not supported in this browser.",
} satisfies Record<CameraPreviewState, string>

export function ScanFrame({
  previewState,
  children,
}: {
  previewState: CameraPreviewState
  children: ReactNode
}) {
  const guidanceMessage = messageByState[previewState]

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-3">
      <div className="relative aspect-3/4 w-full">
        <div className="absolute inset-0 overflow-hidden rounded-[28px] border border-white/12 bg-zinc-950">
          {children}
          <div className="absolute inset-0 bg-linear-to-b from-black/30 via-transparent to-black/35" />

          {previewState !== "ready" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/55 px-6 text-center">
              <div className="space-y-2">
                <p className="text-sm font-medium text-white">
                  {previewState === "loading"
                    ? "Opening camera"
                    : "Camera unavailable"}
                </p>
                <p className="text-xs leading-relaxed text-white/70">
                  {guidanceMessage}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="pointer-events-none absolute inset-3 rounded-3xl border border-white/8" />

        <Corner className="top-3 left-3" />
        <Corner className="top-3 right-3 rotate-90" />
        <Corner className="right-3 bottom-3 rotate-180" />
        <Corner className="bottom-3 left-3 -rotate-90" />
      </div>

      {previewState === "ready" && (
        <p className="min-h-4 text-center text-xs text-white/60">
          {guidanceMessage}
        </p>
      )}
    </div>
  )
}

function Corner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "absolute h-8 w-8 rounded-tl-2xl border-t-2 border-l-2 border-white/75",
        className
      )}
    />
  )
}
