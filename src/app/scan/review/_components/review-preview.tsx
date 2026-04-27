import Image from "next/image";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { type ScanDraftPage } from "../../_providers/scan-provider";
import { ReviewDocumentEdgeOverlay } from "./review-document-edge-overlay";
import { useReviewProcessing } from "./review-processing-provider";

export function ReviewPreview({ page }: { page: ScanDraftPage | null }) {
  const { preview, status, updatePreviewCorner } = useReviewProcessing();

  const { imageUrl: previewImageUrl, corners: previewCorners } =
    page && preview && preview.sourcePageId === page.id
      ? preview
      : { imageUrl: null, corners: null };

  const imageUrl = previewImageUrl ?? page?.imageUrl;

  return (
    <div className="mx-auto w-full max-w-sm">
      <div
        data-filter={page?.filter}
        className={
          "relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-xl border bg-muted transition-all data-[filter=none]:bg-transparent data-[filter=bw]:bg-zinc-100 data-[filter=bw]:contrast-150 data-[filter=grayscale]:grayscale data-[filter=color]:saturate-150"
        }
      >
        {imageUrl && page ? (
          <Image
            src={imageUrl}
            alt={previewImageUrl ? "Processed scan preview" : "Captured scan"}
            fill
            unoptimized
            className={cn(
              "h-full w-full object-contain transition-transform",
              `rotate-[${page.rotation}]`,
            )}
          />
        ) : (
          <FileText className="size-16 text-muted-foreground/40" />
        )}

        {previewCorners && (
          <ReviewDocumentEdgeOverlay
            corners={previewCorners}
            onCornerChange={updatePreviewCorner}
          />
        )}

        {(status === "processing" || status === "applying") && (
          <div className="absolute inset-0 grid place-items-center bg-background/70 text-sm font-medium backdrop-blur-sm">
            {status === "applying"
              ? "Applying correction..."
              : "Processing document..."}
          </div>
        )}
      </div>
    </div>
  );
}
