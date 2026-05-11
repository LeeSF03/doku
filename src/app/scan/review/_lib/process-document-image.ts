import { canvasToBlob } from "@/lib/canvas"
import { detectDocumentCornersWithGammaCv } from "@/lib/document-detection"
import { transformDocumentWithGammaCv } from "@/lib/document-transform"

export type DocumentPoint = {
  x: number
  y: number
}

export type DocumentCorners = [
  DocumentPoint,
  DocumentPoint,
  DocumentPoint,
  DocumentPoint,
]

export type DocumentCorrectionPreview = {
  blob: Blob
  corners: DocumentCorners
}

export async function transformDocumentImage(
  imageUrl: string,
  corners: DocumentCorners
) {
  const imageResponse = await fetch(imageUrl)

  if (!imageResponse.ok) {
    throw new Error("Could not load document image for transform.")
  }

  return transformDocumentWithGammaCv(await imageResponse.blob(), corners)
}

export async function createDocumentCorrectionPreview(imageUrl: string) {
  const image = await loadImage(imageUrl)
  const canvas = document.createElement("canvas")
  const context = canvas.getContext("2d")

  if (!context) {
    throw new Error("Could not create image processing context.")
  }

  const targetWidth = image.naturalWidth
  const targetHeight = Math.round(targetWidth * 1.414)
  const source = getCenteredDocumentCrop(image, targetWidth / targetHeight)

  canvas.width = targetWidth
  canvas.height = targetHeight

  context.fillStyle = "#ffffff"
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(
    image,
    source.x,
    source.y,
    source.width,
    source.height,
    0,
    0,
    canvas.width,
    canvas.height
  )

  const detectedCorners = await detectDocumentCornersWithGammaCv(image)

  if (detectedCorners) {
    console.log("[document-detection] Using GammaCV corners.", {
      corners: detectedCorners,
    })
  } else {
    console.warn("[document-detection] GammaCV found no corners.")
  }

  return {
    blob: await canvasToBlob(canvas, {
      quality: 0.92,
      type: "image/jpeg",
    }),
    corners: detectedCorners
      ? mapImageCornersToCropCorners(detectedCorners, source, image)
      : [
          { x: 0.03, y: 0.03 },
          { x: 0.97, y: 0.03 },
          { x: 0.97, y: 0.97 },
          { x: 0.03, y: 0.97 },
        ],
  } satisfies DocumentCorrectionPreview
}

function getCenteredDocumentCrop(
  image: HTMLImageElement,
  targetAspectRatio: number
) {
  let width = image.naturalWidth
  let height = Math.round(width / targetAspectRatio)

  if (height > image.naturalHeight) {
    height = image.naturalHeight
    width = Math.round(height * targetAspectRatio)
  }

  return {
    x: Math.round((image.naturalWidth - width) / 2),
    y: Math.round((image.naturalHeight - height) / 2),
    width,
    height,
  }
}

function mapImageCornersToCropCorners(
  corners: DocumentCorners,
  source: ReturnType<typeof getCenteredDocumentCrop>,
  image: HTMLImageElement
): DocumentCorners {
  return corners.map((corner) => {
    const x = (corner.x * image.naturalWidth - source.x) / source.width
    const y = (corner.y * image.naturalHeight - source.y) / source.height

    return {
      x: Math.min(1, Math.max(0, x)),
      y: Math.min(1, Math.max(0, y)),
    }
  }) as DocumentCorners
}

function loadImage(imageUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()

    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("Could not load captured image."))
    image.src = imageUrl
  })
}
