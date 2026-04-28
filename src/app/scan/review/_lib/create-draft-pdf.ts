import type { PDFPageDrawImageOptions } from "pdf-lib"

import { canvasToBlob } from "@/lib/canvas"

import type {
  ScanDraftPage,
  ScanFilterId,
} from "../../_providers/scan-provider"

const PDF_IMAGE_MARGIN = 0
const PDF_IMAGE_QUALITY = 0.92

const canvasFilterByScanFilter = {
  original: "none",
  bw: "grayscale(1) contrast(1.5)",
  grayscale: "grayscale(1)",
  color: "saturate(1.5)",
} satisfies Record<ScanFilterId, string>

const imagePlacementByRotation = {
  0: { x: 0, y: 0 },
  90: { x: 1, y: 0 },
  180: { x: 1, y: 1 },
  270: { x: 0, y: 1 },
} satisfies Record<
  ScanDraftPage["rotation"],
  Pick<PDFPageDrawImageOptions, "x" | "y">
>

export async function createDraftPdf(pages: ScanDraftPage[]) {
  if (pages.length === 0) {
    throw new Error("Add at least one page before saving.")
  }

  const { degrees, PDFDocument } = await import("pdf-lib")
  const pdfDocument = await PDFDocument.create()

  for (const draftPage of pages) {
    const imageResponse = await fetch(draftPage.imageUrl)

    if (!imageResponse.ok) {
      throw new Error("Could not load one of the scanned pages.")
    }

    const filteredImageBlob = await applyScanFilterToImage(
      await imageResponse.blob(),
      draftPage.filter
    )
    const image = await pdfDocument.embedJpg(
      await filteredImageBlob.arrayBuffer()
    )
    const rotated = draftPage.rotation === 90 || draftPage.rotation === 270
    const pageWidth = rotated ? image.height : image.width
    const pageHeight = rotated ? image.width : image.height
    const pdfPage = pdfDocument.addPage([pageWidth, pageHeight])
    const imagePlacement = imagePlacementByRotation[draftPage.rotation]

    pdfPage.drawImage(image, {
      x: imagePlacement.x * pageWidth + PDF_IMAGE_MARGIN,
      y: imagePlacement.y * pageHeight + PDF_IMAGE_MARGIN,
      width: image.width,
      height: image.height,
      rotate: degrees(draftPage.rotation),
    })
  }

  const pdfBytes = await pdfDocument.save()

  return new Blob([pdfBytes.buffer as ArrayBuffer], {
    type: "application/pdf",
  })
}

export function downloadPdf(pdfBlob: Blob, fileName: string) {
  const objectUrl = URL.createObjectURL(pdfBlob)
  const link = document.createElement("a")

  link.href = objectUrl
  link.download = fileName
  link.click()
  URL.revokeObjectURL(objectUrl)
}

async function applyScanFilterToImage(imageBlob: Blob, filter: ScanFilterId) {
  const image = await createImageBitmap(imageBlob)
  const canvas = document.createElement("canvas")
  const context = canvas.getContext("2d")

  if (!context) {
    throw new Error("Could not prepare page for PDF export.")
  }

  canvas.width = image.width
  canvas.height = image.height
  context.filter = canvasFilterByScanFilter[filter]
  context.drawImage(image, 0, 0)

  return canvasToBlob(canvas, {
    quality: PDF_IMAGE_QUALITY,
    type: "image/jpeg",
  })
}
