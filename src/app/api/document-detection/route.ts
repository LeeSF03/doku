import sharp from "sharp";

import {
  type DocumentCorners,
  type DocumentPoint,
} from "@/app/scan/review/_lib/process-document-image";

export const runtime = "nodejs";

const MAX_DETECTION_SIZE = 900;
const MIN_AREA_RATIO = 0.05;
const MAX_AREA_RATIO = 0.92;
const ACTIVE_ROW_RATIO = 0.05;
const ACTIVE_COLUMN_RATIO = 0.05;
const DOCUMENT_INSET_RATIO = 0.03;

type DetectionBounds = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("image");

  if (!(file instanceof File)) {
    return Response.json({ error: "Missing image file." }, { status: 400 });
  }

  console.log("[document-detection:server] Received image.", {
    size: file.size,
    type: file.type,
  });

  const imageBuffer = Buffer.from(await file.arrayBuffer());
  const corners = await detectDocumentCorners(imageBuffer);

  return Response.json({ corners });
}

async function detectDocumentCorners(imageBuffer: Buffer) {
  const { data, info } = await sharp(imageBuffer)
    .rotate()
    .resize({
      width: MAX_DETECTION_SIZE,
      height: MAX_DETECTION_SIZE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  console.log("[document-detection:server] Prepared grayscale image.", {
    width: info.width,
    height: info.height,
  });

  const threshold = getOtsuThreshold(data);
  const borderMean = getBorderMean(data, info.width, info.height);
  const centerMean = getCenterMean(data, info.width, info.height);
  const documentIsLight = centerMean >= borderMean;
  const cutoff = documentIsLight
    ? Math.max(threshold, borderMean + 12)
    : Math.min(threshold, borderMean - 12);

  console.log("[document-detection:server] Calculated threshold.", {
    threshold,
    borderMean,
    centerMean,
    documentIsLight,
    cutoff,
  });

  const bounds = getForegroundBounds(
    data,
    info.width,
    info.height,
    documentIsLight,
    cutoff
  );

  if (!bounds) {
    console.log("[document-detection:server] No confident document bounds.");
    return null;
  }

  const areaRatio =
    ((bounds.right - bounds.left + 1) * (bounds.bottom - bounds.top + 1)) /
    (info.width * info.height);

  console.log("[document-detection:server] Candidate bounds.", {
    ...bounds,
    areaRatio,
  });

  if (areaRatio < MIN_AREA_RATIO || areaRatio > MAX_AREA_RATIO) {
    console.log("[document-detection:server] Rejected candidate bounds.", {
      areaRatio,
    });
    return null;
  }

  return insetCorners(getNormalizedCorners(bounds, info.width, info.height));
}

function getOtsuThreshold(pixels: Uint8Array) {
  const histogram = new Array<number>(256).fill(0);

  for (const pixel of pixels) {
    histogram[pixel] += 1;
  }

  const total = pixels.length;
  let sum = 0;

  for (let value = 0; value < histogram.length; value += 1) {
    sum += value * histogram[value];
  }

  let backgroundWeight = 0;
  let backgroundSum = 0;
  let bestThreshold = 0;
  let bestVariance = 0;

  for (let value = 0; value < histogram.length; value += 1) {
    backgroundWeight += histogram[value];

    if (backgroundWeight === 0) {
      continue;
    }

    const foregroundWeight = total - backgroundWeight;

    if (foregroundWeight === 0) {
      break;
    }

    backgroundSum += value * histogram[value];

    const backgroundMean = backgroundSum / backgroundWeight;
    const foregroundMean = (sum - backgroundSum) / foregroundWeight;
    const variance =
      backgroundWeight *
      foregroundWeight *
      (backgroundMean - foregroundMean) *
      (backgroundMean - foregroundMean);

    if (variance > bestVariance) {
      bestVariance = variance;
      bestThreshold = value;
    }
  }

  return bestThreshold;
}

function getBorderMean(pixels: Uint8Array, width: number, height: number) {
  const borderSize = Math.max(1, Math.round(Math.min(width, height) * 0.08));
  let sum = 0;
  let count = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const isBorder =
        x < borderSize ||
        x >= width - borderSize ||
        y < borderSize ||
        y >= height - borderSize;

      if (isBorder) {
        sum += pixels[y * width + x];
        count += 1;
      }
    }
  }

  return sum / count;
}

function getCenterMean(pixels: Uint8Array, width: number, height: number) {
  const left = Math.round(width * 0.25);
  const right = Math.round(width * 0.75);
  const top = Math.round(height * 0.25);
  const bottom = Math.round(height * 0.75);
  let sum = 0;
  let count = 0;

  for (let y = top; y < bottom; y += 1) {
    for (let x = left; x < right; x += 1) {
      sum += pixels[y * width + x];
      count += 1;
    }
  }

  return sum / count;
}

function getForegroundBounds(
  pixels: Uint8Array,
  width: number,
  height: number,
  documentIsLight: boolean,
  cutoff: number
) {
  const rowCounts = new Array<number>(height).fill(0);
  const columnCounts = new Array<number>(width).fill(0);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const pixel = pixels[y * width + x];
      const isForeground = documentIsLight ? pixel >= cutoff : pixel <= cutoff;

      if (isForeground) {
        rowCounts[y] += 1;
        columnCounts[x] += 1;
      }
    }
  }

  const minRowCount = width * ACTIVE_ROW_RATIO;
  const minColumnCount = height * ACTIVE_COLUMN_RATIO;
  const top = rowCounts.findIndex((count) => count >= minRowCount);
  const bottom = rowCounts.findLastIndex((count) => count >= minRowCount);
  const left = columnCounts.findIndex((count) => count >= minColumnCount);
  const right = columnCounts.findLastIndex((count) => count >= minColumnCount);

  if (top === -1 || bottom === -1 || left === -1 || right === -1) {
    return null;
  }

  return { left, top, right, bottom } satisfies DetectionBounds;
}

function getNormalizedCorners(
  bounds: DetectionBounds,
  width: number,
  height: number
): DocumentCorners {
  return [
    { x: bounds.left / width, y: bounds.top / height },
    { x: bounds.right / width, y: bounds.top / height },
    { x: bounds.right / width, y: bounds.bottom / height },
    { x: bounds.left / width, y: bounds.bottom / height },
  ];
}

function insetCorners(corners: DocumentCorners): DocumentCorners {
  const center = corners.reduce<DocumentPoint>(
    (sum, corner) => ({ x: sum.x + corner.x / 4, y: sum.y + corner.y / 4 }),
    { x: 0, y: 0 }
  );

  return corners.map((corner) => ({
    x: corner.x + (center.x - corner.x) * DOCUMENT_INSET_RATIO,
    y: corner.y + (center.y - corner.y) * DOCUMENT_INSET_RATIO,
  })) as DocumentCorners;
}
