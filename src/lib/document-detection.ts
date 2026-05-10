"use client"

export type DetectedDocumentPoint = {
  x: number
  y: number
}

export type DetectedDocumentCorners = [
  DetectedDocumentPoint,
  DetectedDocumentPoint,
  DetectedDocumentPoint,
  DetectedDocumentPoint,
]

type Gammacv = typeof import("gammacv")
type GammaOutput = NonNullable<ReturnType<Gammacv["tensorFrom"]>>

type DetectedLine = {
  angle: number
  x1: number
  x2: number
  y1: number
  y2: number
}

type CandidateLine = {
  line: DetectedLine
  score: number
}

const MAX_DETECTION_SIZE = 1000
const MIN_AREA_RATIO = 0.05
const MAX_AREA_RATIO = 0.95
const MIN_SIDE_LENGTH_RATIO = 0.12
const PC_LINES_DOWNSAMPLE = 2
const PC_LINES_COUNT = 30
const PC_LINES_LAYERS = 2

export async function detectDocumentCornersWithGammaCv(
  image: HTMLImageElement
): Promise<DetectedDocumentCorners | null> {
  const startedAt = performance.now()

  try {
    const gm = await import("gammacv")
    const canvas = createDetectionCanvas(image)
    const corners = runGammaCvLineDetection(gm, canvas)

    console.log("[document-detection:gammacv] Detection completed.", {
      foundCorners: Boolean(corners),
      corners,
      elapsedMs: getElapsedMs(startedAt),
    })

    return corners
  } catch (error) {
    console.warn("[document-detection:gammacv] Detection failed.", {
      error: serializeError(error),
      elapsedMs: getElapsedMs(startedAt),
    })
    return null
  }
}

function createDetectionCanvas(image: HTMLImageElement) {
  const scale = Math.min(
    1,
    MAX_DETECTION_SIZE / Math.max(image.naturalWidth, image.naturalHeight)
  )
  const canvas = document.createElement("canvas")
  const context = canvas.getContext("2d", { willReadFrequently: true })

  if (!context) {
    throw new Error("Could not create GammaCV detection canvas.")
  }

  canvas.width = Math.round(image.naturalWidth * scale)
  canvas.height = Math.round(image.naturalHeight * scale)

  context.drawImage(image, 0, 0, canvas.width, canvas.height)

  console.log("[document-detection:gammacv] Detection canvas prepared.", {
    sourceWidth: image.naturalWidth,
    sourceHeight: image.naturalHeight,
    width: canvas.width,
    height: canvas.height,
    scale,
  })

  return canvas
}

function runGammaCvLineDetection(gm: Gammacv, canvas: HTMLCanvasElement) {
  const startedAt = performance.now()
  const source = new gm.Tensor<Uint8Array>("uint8", [
    canvas.height,
    canvas.width,
    4,
  ])
  let output: GammaOutput | null = null
  const session = new gm.Session()

  try {
    console.log("[document-detection:gammacv] Copying canvas to tensor.")
    gm.canvasToTensor(canvas, source)

    console.log("[document-detection:gammacv] Building PC Lines graph.", {
      elapsedMs: getElapsedMs(startedAt),
    })

    let operation = gm.grayscale(source)
    operation = gm.downsample(operation, PC_LINES_DOWNSAMPLE)
    operation = gm.gaussianBlur(operation, 3, 3)
    operation = gm.sobelOperator(operation)
    operation = gm.cannyEdges(operation, 0.25, 0.75)
    operation = gm.pcLines(operation, PC_LINES_LAYERS, 2, 2)
    output = gm.tensorFrom(operation)

    if (!output) {
      throw new Error("Could not create GammaCV PC Lines output tensor.")
    }

    console.log("[document-detection:gammacv] Running PC Lines graph.", {
      shape: operation.shape,
      elapsedMs: getElapsedMs(startedAt),
    })

    session.init(operation)
    session.runOp(operation, 0, output)

    const lines = getPcLines(gm, output, canvas.width, canvas.height)
    const corners = getDocumentCornersFromLines(
      lines,
      canvas.width,
      canvas.height
    )

    console.log("[document-detection:gammacv] PC Lines analyzed.", {
      totalLines: lines.length,
      verticalLines: lines.filter(({ line }) => isVerticalish(line)).length,
      horizontalLines: lines.filter(({ line }) => isHorizontalish(line)).length,
      sample: lines.slice(0, 8).map(({ line, score }) => ({
        angle: line.angle,
        score,
        x1: Math.round(line.x1),
        y1: Math.round(line.y1),
        x2: Math.round(line.x2),
        y2: Math.round(line.y2),
      })),
      elapsedMs: getElapsedMs(startedAt),
    })

    return corners
  } finally {
    session.destroy()
    source.release()
    output?.release()
  }
}

function getPcLines(
  gm: Gammacv,
  output: GammaOutput,
  width: number,
  height: number
) {
  const maxDimension = Math.max(height, width)
  const line = new gm.Line()
  const lines: CandidateLine[] = []

  for (let index = 0; index < output.size / 4; index++) {
    const y = Math.floor(index / output.shape[1])
    const x = index - y * output.shape[1]
    const score = output.get(y, x, 0)

    if (score <= 0) continue

    line.fromParallelCoords(
      output.get(y, x, 1) * PC_LINES_DOWNSAMPLE,
      output.get(y, x, 2) * PC_LINES_DOWNSAMPLE,
      width,
      height,
      maxDimension,
      maxDimension / 2
    )
    lines.push({
      line: {
        angle: line.angle,
        x1: line.x1,
        x2: line.x2,
        y1: line.y1,
        y2: line.y2,
      },
      score,
    })
  }

  return lines
    .sort((lineA, lineB) => lineB.score - lineA.score)
    .slice(0, PC_LINES_COUNT)
}

function getDocumentCornersFromLines(
  lines: CandidateLine[],
  width: number,
  height: number
) {
  const verticalLines = lines.filter(({ line }) => isVerticalish(line))
  const horizontalLines = lines.filter(({ line }) => isHorizontalish(line))

  if (verticalLines.length < 2 || horizontalLines.length < 2) return null

  const centerX = width / 2
  const centerY = height / 2
  const crossingVerticalLines = verticalLines.filter(({ line }) => {
    const x = getLineXAtY(line, centerY)

    return Number.isFinite(x) && x >= -width && x <= width * 2
  })
  const crossingHorizontalLines = horizontalLines.filter(({ line }) => {
    const y = getLineYAtX(line, centerX)

    return Number.isFinite(y) && y >= -height && y <= height * 2
  })

  if (crossingVerticalLines.length < 2 || crossingHorizontalLines.length < 2) {
    console.log("[document-detection:gammacv] Not enough crossing lines.", {
      crossingHorizontalLines: crossingHorizontalLines.length,
      crossingVerticalLines: crossingVerticalLines.length,
    })
    return null
  }

  const left = minBy(crossingVerticalLines, ({ line }) =>
    getLineXAtY(line, centerY)
  ).line
  const right = maxBy(crossingVerticalLines, ({ line }) =>
    getLineXAtY(line, centerY)
  ).line
  const top = minBy(crossingHorizontalLines, ({ line }) =>
    getLineYAtX(line, centerX)
  ).line
  const bottom = maxBy(crossingHorizontalLines, ({ line }) =>
    getLineYAtX(line, centerX)
  ).line
  const corners = orderCorners(
    [
      getLineIntersection(left, top),
      getLineIntersection(right, top),
      getLineIntersection(right, bottom),
      getLineIntersection(left, bottom),
    ].map((point) => clampPoint(point, width, height))
  )

  if (!isValidDocumentCandidate(corners, width, height)) {
    console.log("[document-detection:gammacv] PC Lines rectangle rejected.", {
      areaRatio: polygonArea(corners) / (width * height),
      corners,
      lineCrossings: {
        bottomY: getLineYAtX(bottom, centerX),
        leftX: getLineXAtY(left, centerY),
        rightX: getLineXAtY(right, centerY),
        topY: getLineYAtX(top, centerX),
      },
      sideLengths: getSideLengths(corners),
    })
    return null
  }

  return corners.map((point) => ({
    x: clamp(point.x / width),
    y: clamp(point.y / height),
  })) as DetectedDocumentCorners
}

function isVerticalish(line: DetectedLine) {
  const dx = Math.abs(line.x2 - line.x1)
  const dy = Math.abs(line.y2 - line.y1)

  return dy > dx * 1.2
}

function isHorizontalish(line: DetectedLine) {
  const dx = Math.abs(line.x2 - line.x1)
  const dy = Math.abs(line.y2 - line.y1)

  return dx > dy * 1.2
}

function getLineMidpoint(line: DetectedLine): DetectedDocumentPoint {
  return {
    x: (line.x1 + line.x2) / 2,
    y: (line.y1 + line.y2) / 2,
  }
}

function getLineXAtY(line: DetectedLine, y: number) {
  const dy = line.y2 - line.y1

  if (dy === 0) return getLineMidpoint(line).x

  return line.x1 + ((y - line.y1) * (line.x2 - line.x1)) / dy
}

function getLineYAtX(line: DetectedLine, x: number) {
  const dx = line.x2 - line.x1

  if (dx === 0) return getLineMidpoint(line).y

  return line.y1 + ((x - line.x1) * (line.y2 - line.y1)) / dx
}

function getLineIntersection(
  lineA: DetectedLine,
  lineB: DetectedLine
): DetectedDocumentPoint {
  const x1 = lineA.x1
  const y1 = lineA.y1
  const x2 = lineA.x2
  const y2 = lineA.y2
  const x3 = lineB.x1
  const y3 = lineB.y1
  const x4 = lineB.x2
  const y4 = lineB.y2
  const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)

  if (denominator === 0) {
    return {
      x: (getLineMidpoint(lineA).x + getLineMidpoint(lineB).x) / 2,
      y: (getLineMidpoint(lineA).y + getLineMidpoint(lineB).y) / 2,
    }
  }

  return {
    x:
      ((x1 * y2 - y1 * x2) * (x3 - x4) -
        (x1 - x2) * (x3 * y4 - y3 * x4)) /
      denominator,
    y:
      ((x1 * y2 - y1 * x2) * (y3 - y4) -
        (y1 - y2) * (x3 * y4 - y3 * x4)) /
      denominator,
  }
}

function clampPoint(
  point: DetectedDocumentPoint,
  width: number,
  height: number
): DetectedDocumentPoint {
  return {
    x: Math.min(width, Math.max(0, point.x)),
    y: Math.min(height, Math.max(0, point.y)),
  }
}

function isValidDocumentCandidate(
  points: DetectedDocumentPoint[],
  width: number,
  height: number
) {
  const areaRatio = polygonArea(points) / (width * height)

  if (areaRatio < MIN_AREA_RATIO || areaRatio > MAX_AREA_RATIO) return false

  return (
    Math.min(...getSideLengths(points)) >=
    Math.min(width, height) * MIN_SIDE_LENGTH_RATIO
  )
}

function orderCorners(points: DetectedDocumentPoint[]) {
  const topLeft = minBy(points, (point) => point.x + point.y)
  const bottomRight = maxBy(points, (point) => point.x + point.y)
  const topRight = maxBy(points, (point) => point.x - point.y)
  const bottomLeft = minBy(points, (point) => point.x - point.y)

  return [topLeft, topRight, bottomRight, bottomLeft]
}

function getSideLengths(points: DetectedDocumentPoint[]) {
  return [
    distance(points[0], points[1]),
    distance(points[1], points[2]),
    distance(points[2], points[3]),
    distance(points[3], points[0]),
  ]
}

function polygonArea(points: DetectedDocumentPoint[]) {
  let area = 0

  for (let index = 0; index < points.length; index++) {
    const current = points[index]
    const next = points[(index + 1) % points.length]

    area += current.x * next.y - next.x * current.y
  }

  return Math.abs(area / 2)
}

function distance(pointA: DetectedDocumentPoint, pointB: DetectedDocumentPoint) {
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

function getElapsedMs(startedAt: number) {
  return Math.round(performance.now() - startedAt)
}

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack,
    }
  }

  return String(error)
}
