export function canvasToBlob(
  canvas: HTMLCanvasElement,
  options: { quality?: number; type?: string } = {},
) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not export canvas."));
          return;
        }

        resolve(blob);
      },
      options.type,
      options.quality,
    );
  });
}
