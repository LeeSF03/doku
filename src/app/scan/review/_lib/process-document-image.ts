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
    canvas.height
  );

  return {
    blob: await canvasToBlob(canvas),
    corners: getNormalizedCorners(source, image),
  } satisfies ProcessedDocumentImage;
}

function getCenteredDocumentCrop(
  image: HTMLImageElement,
  targetAspectRatio: number
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

function getNormalizedCorners(
  source: ReturnType<typeof getCenteredDocumentCrop>,
  image: HTMLImageElement
): DocumentCorners {
  const left = source.x / image.naturalWidth;
  const top = source.y / image.naturalHeight;
  const right = (source.x + source.width) / image.naturalWidth;
  const bottom = (source.y + source.height) / image.naturalHeight;

  return [
    { x: left, y: top },
    { x: right, y: top },
    { x: right, y: bottom },
    { x: left, y: bottom },
  ];
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
      0.92
    );
  });
}
