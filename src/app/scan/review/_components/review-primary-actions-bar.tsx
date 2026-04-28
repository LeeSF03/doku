import Link from "next/link"
import { useRouter } from "next/navigation"

import { Check, Plus, RotateCcw, WandSparkles, X } from "lucide-react"

import { Button } from "@/components/ui/button"

import { type ScanDraftPage } from "../../_providers/scan-provider"
import {
  type CorrectionPreview,
  type PreviewCorrectionStatus,
} from "../_hooks/use-correction-preview"

export function ReviewPrimaryActionBar({
  createCorrectionPreview,
  createCorrectedImage,
  currentPage,
  preview,
  clearCorrectionPreview,
  status,
}: {
  createCorrectionPreview: () => Promise<void>
  createCorrectedImage: () => Promise<void>
  currentPage: ScanDraftPage | null
  preview: CorrectionPreview | null
  clearCorrectionPreview: () => void
  status: PreviewCorrectionStatus
}) {
  const router = useRouter()
  const detecting = status === "detecting"
  const transforming = status === "transforming"

  const handleRetake = () => {
    if (!currentPage) return

    router.push(`/scan?replace-page-id=${encodeURIComponent(currentPage.id)}`)
  }

  return (
    <div className="mt-4 space-y-2">
      <div className="flex gap-2">
        {preview ? (
          <>
            <Button
              type="button"
              size="sm"
              onClick={createCorrectedImage}
              disabled={transforming}
              className="flex-1 gap-1.5"
            >
              <Check className="size-4" />
              {transforming ? "Applying" : "Apply"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearCorrectionPreview}
              disabled={transforming}
              className="flex-1 gap-1.5"
            >
              <X className="size-4" />
              Cancel
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={createCorrectionPreview}
              disabled={!currentPage || detecting}
              className="flex-1 gap-1.5"
            >
              <WandSparkles className="size-4" />
              {detecting ? "Processing" : "Correct"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRetake}
              disabled={!currentPage}
              className="flex-1 gap-1.5"
            >
              <RotateCcw className="size-4" />
              Retake
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5"
            >
              <Link href="/scan">
                <Plus className="size-4" />
                Add page
              </Link>
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
