import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDraftCurrentPage } from "../_hooks/use-draft-current-page";
import { ReviewDocumentEdgeOverlay } from "./review-document-edge-overlay";
import { ReviewProcessingActions } from "./review-processing-actions";
import { useReviewProcessing } from "./review-processing-provider";
import Image from "next/image";

export function ReviewPreview() {
  const page = useDraftCurrentPage();
  const { preview, status, updatePreviewCorner } = useReviewProcessing();

  const { imageUrl: previewImageUrl, corners: previewCorners } =
    page && preview && preview.sourcePageId === page.id
      ? preview
      : { imageUrl: null, corners: null };

  const imageUrl = preview ? previewImageUrl : page?.imageUrl;

  return (
    <>
      <div className="mx-auto w-full max-w-sm">
        <div
          data-filer={page?.filter}
          className={
            "relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-xl border bg-muted transition-all data-[filer=none]:bg-transparent data-[filer=bw]:bg-zinc-100 data-[filer=bw]:contrast-150 data-[filer=grayscale]:grayscale data-[filer=color]:saturate-150"
          }
        >
          {imageUrl && page ? (
            <Image
              src={imageUrl}
              alt={previewImageUrl ? "Processed scan preview" : "Captured scan"}
              fill
              unoptimized
              className={cn(
                "h-full w-full object-cover transition-transform",
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

          {status === "processing" && (
            <div className="absolute inset-0 grid place-items-center bg-background/70 text-sm font-medium backdrop-blur-sm">
              Processing document...
            </div>
          )}
        </div>
      </div>

      <ReviewProcessingActions />
    </>
  );
}
