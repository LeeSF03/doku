"use client"

import { useEffect, useRef, useState } from "react"

import { toast } from "sonner"
import { useImmer } from "use-immer"

import {
  type DocumentCorners,
  createDocumentCorrectionPreview,
  transformDocumentImage,
} from "../_lib/process-document-image"

export type PreviewCorrectionStatus =
  | "idle"
  | "detecting"
  | "ready"
  | "transforming"
  | "failed"

export type CorrectionPreview = {
  corners: DocumentCorners
  sourcePageId: string
  imageUrl: string
}

export type SetCorrectionPreview = (preview: CorrectionPreview | null) => void

export function useCorrectionPreview() {
  const [status, setStatus] = useState<PreviewCorrectionStatus>("idle")
  const [preview, setPreview] = useImmer<CorrectionPreview | null>(null)
  const previewRef = useRef<CorrectionPreview | null>(null)

  const setCorrectionPreview: SetCorrectionPreview = (nextPreview) => {
    setPreview((currentPreview) => {
      const currentImageUrl = currentPreview?.imageUrl

      if (currentImageUrl && currentImageUrl !== nextPreview?.imageUrl) {
        URL.revokeObjectURL(currentImageUrl)
      }

      return nextPreview
    })
    previewRef.current = nextPreview
  }

  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current.imageUrl)
    }
  }, [])

  async function createCorrectionPreview(pageId: string, imageUrl: string) {
    if (status === "detecting") return

    setStatus("detecting")

    try {
      const processedImage = await createDocumentCorrectionPreview(imageUrl)

      setCorrectionPreview({
        corners: processedImage.corners,
        sourcePageId: pageId,
        imageUrl: URL.createObjectURL(processedImage.blob),
      })
      setStatus("ready")
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not process this document."

      setStatus("failed")
      toast.error("Document processing failed", {
        description: message,
      })
    }
  }

  async function createCorrectedImage() {
    if (!preview || status === "transforming") return null

    setStatus("transforming")

    try {
      const transformedImage = await transformDocumentImage(
        preview.imageUrl,
        preview.corners
      )

      setStatus("ready")
      return transformedImage
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not transform this document."

      setStatus("failed")
      toast.error("Document transform failed", {
        description: message,
      })
      return null
    }
  }

  return {
    createCorrectedImage,
    createCorrectionPreview,
    preview,
    setCorrectionPreview,
    status,
  }
}
