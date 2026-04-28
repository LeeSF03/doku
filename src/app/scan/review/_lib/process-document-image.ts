import { canvasToBlob } from "@/lib/canvas"

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

  const imageBlob = await imageResponse.blob()
  const formData = new FormData()

  formData.set("image", imageBlob, "scan.jpg")
  formData.set("corners", JSON.stringify(corners))

  const transformResponse = await fetch("/api/document-transform", {
    method: "POST",
    body: formData,
  })

  if (!transformResponse.ok) {
    throw new Error("Document transform request failed.")
  }

  return transformResponse.blob()
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

  const detectedCorners = await detectDocumentCorners(imageUrl)

  return {
    blob: await canvasToBlob(canvas, {
      quality: 0.92,
      type: "image/jpeg",
    }),
    corners: detectedCorners
      ? mapImageCornersToCropCorners(detectedCorners, source, image)
      : getInsetPreviewCorners(),
  } satisfies DocumentCorrectionPreview
}

async function detectDocumentCorners(imageUrl: string) {
  try {
    const imageResponse = await fetch(imageUrl)

    if (!imageResponse.ok) {
      throw new Error("Could not load captured image for detection.")
    }

    const imageBlob = await imageResponse.blob()
    const formData = new FormData()

    formData.set("image", imageBlob, "scan.jpg")

    const detectionResponse = await fetch("/api/document-detection", {
      method: "POST",
      body: formData,
    })

    if (!detectionResponse.ok) {
      throw new Error("Document detection request failed.")
    }

    const result = (await detectionResponse.json()) as {
      corners: DocumentCorners | null
    }

    return result.corners
  } catch (error) {
    console.warn("[document-detection] Falling back to default corners.", error)
    return null
  }
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

function getInsetPreviewCorners(): DocumentCorners {
  return [
    { x: 0.03, y: 0.03 },
    { x: 0.97, y: 0.03 },
    { x: 0.97, y: 0.97 },
    { x: 0.03, y: 0.97 },
  ]
}

function loadImage(imageUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()

    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("Could not load captured image."))
    image.src = imageUrl
  })
}
