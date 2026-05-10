"use client"

import { canvasToBlob } from "@/lib/canvas"
import { getGammaCv, type Gammacv } from "@/lib/gammacv"

export type TransformDocumentPoint = {
  x: number
  y: number
}

export type TransformDocumentCorners = [
  TransformDocumentPoint,
  TransformDocumentPoint,
  TransformDocumentPoint,
  TransformDocumentPoint,
]

export async function transformDocumentWithGammaCv(
  imageBlob: Blob,
  corners: TransformDocumentCorners
) {
  const gm = await getGammaCv()
  const startedAt = performance.now()
  const image = await createImageBitmap(imageBlob)

  try {
    const sourceCanvas = createSourceCanvas(image)
    const pixelCorners = orderCorners(
      corners.map((corner) => ({
        x: clamp(corner.x) * image.width,
        y: clamp(corner.y) * image.height,
      }))
    )
    const { width, height } = getTransformSize(pixelCorners)
    const transformedCanvas = correctGammaCvCanvasOrientation(
      runGammaCvPerspectiveTransform(
        gm,
        sourceCanvas,
        pixelCorners,
        width,
        height
      )
    )

    console.log("[document-transform:gammacv] Transform completed.", {
      corners: pixelCorners,
      elapsedMs: Math.round(performance.now() - startedAt),
      height,
      width,
    })

    return canvasToBlob(transformedCanvas, {
      quality: 0.92,
      type: "image/jpeg",
    })
  } finally {
    image.close()
  }
}

function createSourceCanvas(image: ImageBitmap) {
  const canvas = document.createElement("canvas")
  const context = canvas.getContext("2d")

  if (!context) {
    throw new Error("Could not create GammaCV transform canvas.")
  }

  canvas.width = image.width
  canvas.height = image.height
  context.drawImage(image, 0, 0, canvas.width, canvas.height)

  return canvas
}

function runGammaCvPerspectiveTransform(
  gm: Gammacv,
  sourceCanvas: HTMLCanvasElement,
  corners: TransformDocumentCorners,
  width: number,
  height: number
) {
  const source = new gm.Tensor<Uint8Array>("uint8", [
    sourceCanvas.height,
    sourceCanvas.width,
    4,
  ])
  const transform = new gm.Tensor<Float32Array>("float32", [3, 1, 4])
  const outputCanvas = document.createElement("canvas")
  const session = new gm.Session()

  try {
    gm.canvasToTensor(sourceCanvas, source)
    gm.generateTransformMatrix(
      new gm.Rect(corners.flatMap((corner) => [corner.x, corner.y])),
      [height, width],
      transform
    )

    const operation = gm.perspectiveProjection(source, transform, [
      height,
      width,
      4,
    ])

    outputCanvas.width = width
    outputCanvas.height = height
    session.init(operation)
    session.runOp(operation, 0, outputCanvas)

    return outputCanvas
  } finally {
    session.destroy()
    source.release()
    transform.release()
  }
}

function correctGammaCvCanvasOrientation(canvas: HTMLCanvasElement) {
  const correctedCanvas = document.createElement("canvas")
  const context = correctedCanvas.getContext("2d")

  if (!context) {
    throw new Error("Could not create GammaCV transform correction canvas.")
  }

  correctedCanvas.width = canvas.width
  correctedCanvas.height = canvas.height

  context.translate(0, canvas.height)
  context.scale(1, -1)
  context.drawImage(canvas, 0, 0)

  return correctedCanvas
}

function getTransformSize(corners: TransformDocumentCorners) {
  const width = Math.max(
    distance(corners[0], corners[1]),
    distance(corners[3], corners[2])
  )
  const height = Math.max(
    distance(corners[1], corners[2]),
    distance(corners[0], corners[3])
  )

  return {
    width: Math.max(2, Math.round(width)),
    height: Math.max(2, Math.round(height)),
  }
}

function orderCorners(points: TransformDocumentPoint[]) {
  const topLeft = minBy(points, (point) => point.x + point.y)
  const bottomRight = maxBy(points, (point) => point.x + point.y)
  const topRight = maxBy(points, (point) => point.x - point.y)
  const bottomLeft = minBy(points, (point) => point.x - point.y)

  return [
    topLeft,
    topRight,
    bottomRight,
    bottomLeft,
  ] as TransformDocumentCorners
}

function distance(
  pointA: TransformDocumentPoint,
  pointB: TransformDocumentPoint
) {
  return Math.hypot(pointA.x - pointB.x, pointA.y - pointB.y)
}

function minBy<T>(values: T[], getValue: (value: T) => number) {
  return values.reduce((best, value) =>
    getValue(value) < getValue(best) ? value : best
  )
}

function maxBy<T>(values: T[], getValue: (value: T) => number) {
  return values.reduce((best, value) =>
    getValue(value) > getValue(best) ? value : best
  )
}

function clamp(value: number) {
  return Math.min(1, Math.max(0, value))
}
