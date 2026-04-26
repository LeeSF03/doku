import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDraftCurrentPage } from "../_hooks/use-draft-current-page";
import { useReviewProcessing } from "./review-processing-provider";

export function ReviewPreview() {
  const page = useDraftCurrentPage();
  const { preview, status } = useReviewProcessing();
  const { imageUrl: previewImageUrl, corners: previewCorners } =
    preview && page && preview.sourcePageId === page.id
      ? preview
      : { imageUrl: null, corners: null };

  const imageUrl = previewCorners
    ? page?.imageUrl
    : (previewImageUrl ?? page?.imageUrl);

  return (
    <div className="mx-auto w-full max-w-sm">
      <div
        className={cn(
          "relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-xl border bg-muted transition-all",
          page?.filter === "bw" && "bg-zinc-100 contrast-150",
          page?.filter === "grayscale" && "grayscale",
          page?.filter === "color" && "saturate-150",
        )}
      >
        {imageUrl && page ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={previewImageUrl ? "Processed scan preview" : "Captured scan"}
            className="h-full w-full object-cover transition-transform"
            style={{ transform: `rotate(${page.rotation}deg)` }}
          />
        ) : (
          <FileText className="size-16 text-muted-foreground/40" />
        )}

        {previewCorners ? (
          <DocumentEdgeOverlay corners={previewCorners} />
        ) : null}

        {status === "processing" ? (
          <div className="absolute inset-0 grid place-items-center bg-background/70 text-sm font-medium backdrop-blur-sm">
            Processing document...
          </div>
        ) : null}
      </div>

      {previewImageUrl ? (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Showing detected document area
        </p>
      ) : null}
    </div>
  );
}

function DocumentEdgeOverlay({
  corners,
}: {
  corners: [
    { x: number; y: number },
    { x: number; y: number },
    { x: number; y: number },
    { x: number; y: number },
  ];
}) {
  const points = corners
    .map((corner) => `${corner.x * 100},${corner.y * 100}`)
    .join(" ");

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0"
      aria-hidden="true"
    >
      <polygon
        points={points}
        className="fill-sky-400/10 stroke-sky-300"
        vectorEffect="non-scaling-stroke"
        strokeWidth="2"
      />
      {corners.map((corner, index) => (
        <circle
          key={`${corner.x}-${corner.y}-${index}`}
          cx={corner.x * 100}
          cy={corner.y * 100}
          r="1.75"
          className="fill-sky-300 stroke-background"
          vectorEffect="non-scaling-stroke"
          strokeWidth="1.5"
        />
      ))}
    </svg>
  );
}
