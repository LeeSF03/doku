export type DocumentPoint = {
  x: number;
  y: number;
};

export type DocumentCorners = [
  DocumentPoint,
  DocumentPoint,
  DocumentPoint,
  DocumentPoint,
];

export type ProcessedDocumentImage = {
  blob: Blob;
  corners: DocumentCorners;
};

export async function processDocumentImage(imageUrl: string) {
  console.log("[document-detection] Starting preview processing.");

  const image = await loadImage(imageUrl);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not create image processing context.");
  }

  const targetWidth = image.naturalWidth;
  const targetHeight = Math.round(targetWidth * 1.414);
  const source = getCenteredDocumentCrop(image, targetWidth / targetHeight);

  canvas.width = targetWidth;
  canvas.height = targetHeight;

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.filter = "contrast(1.08) saturate(0.96)";
  context.drawImage(
    image,
    source.x,
    source.y,
    source.width,
    source.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  const detectedCorners = await detectDocumentCorners(imageUrl);

  return {
    blob: await canvasToBlob(canvas),
    corners: detectedCorners
      ? mapImageCornersToCropCorners(detectedCorners, source, image)
      : getInsetPreviewCorners(),
  } satisfies ProcessedDocumentImage;
}

async function detectDocumentCorners(imageUrl: string) {
  try {
    console.log("[document-detection] Requesting server-side detection.");

    const imageResponse = await fetch(imageUrl);

    if (!imageResponse.ok) {
      throw new Error("Could not load captured image for detection.");
    }

    const imageBlob = await imageResponse.blob();
    const formData = new FormData();

    formData.set("image", imageBlob, "scan.jpg");

    const detectionResponse = await fetch("/api/document-detection", {
      method: "POST",
      body: formData,
    });

    if (!detectionResponse.ok) {
      throw new Error("Document detection request failed.");
    }

    const result = (await detectionResponse.json()) as {
      corners: DocumentCorners | null;
    };

    if (result.corners) {
      console.log("[document-detection] Received server-side corners.", {
        corners: result.corners,
      });
    } else {
      console.log("[document-detection] Server-side detection had no result.");
    }

    return result.corners;
  } catch (error) {
    console.warn(
      "[document-detection] Falling back to default corners.",
      error,
    );
    return null;
  }
}

function getCenteredDocumentCrop(
  image: HTMLImageElement,
  targetAspectRatio: number,
) {
  let width = image.naturalWidth;
  let height = Math.round(width / targetAspectRatio);

  if (height > image.naturalHeight) {
    height = image.naturalHeight;
    width = Math.round(height * targetAspectRatio);
  }

  return {
    x: Math.round((image.naturalWidth - width) / 2),
    y: Math.round((image.naturalHeight - height) / 2),
    width,
    height,
  };
}

function mapImageCornersToCropCorners(
  corners: DocumentCorners,
  source: ReturnType<typeof getCenteredDocumentCrop>,
  image: HTMLImageElement,
): DocumentCorners {
  return corners.map((corner) => {
    const x = (corner.x * image.naturalWidth - source.x) / source.width;
    const y = (corner.y * image.naturalHeight - source.y) / source.height;

    return clampPoint({ x, y });
  }) as DocumentCorners;
}

function getInsetPreviewCorners(): DocumentCorners {
  return [
    { x: 0.03, y: 0.03 },
    { x: 0.97, y: 0.03 },
    { x: 0.97, y: 0.97 },
    { x: 0.03, y: 0.97 },
  ];
}

function clampPoint(point: DocumentPoint): DocumentPoint {
  return {
    x: Math.min(1, Math.max(0, point.x)),
    y: Math.min(1, Math.max(0, point.y)),
  };
}

function loadImage(imageUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load captured image."));
    image.src = imageUrl;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not export processed image."));
          return;
        }

        resolve(blob);
      },
      "image/jpeg",
      0.92,
    );
  });
}
