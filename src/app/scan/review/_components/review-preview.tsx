import Image from "next/image";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  type ScanDraftPage,
  useScanDraftActions,
} from "../../_providers/scan-provider";
import { useCorrectionPreview } from "../_hooks/use-correction-preview";
import {
  type DocumentCorners,
  type DocumentPoint,
} from "../_lib/process-document-image";
import { ReviewDocumentEdgeOverlay } from "./review-document-edge-overlay";
import { ReviewPrimaryActionBar } from "./review-primary-actions-bar";

export function ReviewPreview({ page }: { page: ScanDraftPage | null }) {
  const { replacePageImage } = useScanDraftActions();
  const {
    createCorrectedImage,
    createCorrectionPreview,
    preview,
    setCorrectionPreview,
    status,
  } = useCorrectionPreview();

  const { imageUrl: previewImageUrl, corners: previewCorners } =
    page && preview && preview.sourcePageId === page.id
      ? preview
      : { imageUrl: null, corners: null };

  const imageUrl = previewImageUrl ?? page?.imageUrl;
  const rotatedSideways = page?.rotation === 90 || page?.rotation === 270;

  const handleCreateCorrectionPreview = async () => {
    if (!page) return;

    await createCorrectionPreview(page.id, page.imageUrl);
  };

  const handleCreateCorrectedImage = async () => {
    if (!page) return;

    const correctedImage = await createCorrectedImage();
    if (!correctedImage) return;

    replacePageImage(page.id, URL.createObjectURL(correctedImage));
    setCorrectionPreview(null);
    toast.success("Current page replaced");
  };

  const handlePreviewCornerChange = (
    cornerIndex: number,
    point: DocumentPoint,
  ) => {
    if (!preview) return;

    const nextCorners = [...preview.corners] as DocumentCorners;
    nextCorners[cornerIndex] = {
      x: Math.min(1, Math.max(0, point.x)),
      y: Math.min(1, Math.max(0, point.y)),
    };
    setCorrectionPreview({
      ...preview,
      corners: nextCorners,
    });
  };

  return (
    <>
      <div className="mx-auto w-full max-w-sm">
        <div
          data-filter={page?.filter}
          className={
            "relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-xl border bg-muted transition-all data-[filter=none]:bg-transparent data-[filter=bw]:bg-zinc-100 data-[filter=bw]:contrast-150 data-[filter=grayscale]:grayscale data-[filter=color]:saturate-150"
          }
        >
          {imageUrl && page ? (
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
              <div
                className={cn(
                  "relative transition-transform",
                  rotatedSideways ? "h-3/4 w-[133.333333%]" : "h-full w-full",
                )}
                style={{ transform: `rotate(${page.rotation}deg)` }}
              >
                <Image
                  src={imageUrl}
                  alt={
                    previewImageUrl ? "Processed scan preview" : "Captured scan"
                  }
                  fill
                  unoptimized
                  className="object-contain"
                />
              </div>
            </div>
          ) : (
            <FileText className="size-16 text-muted-foreground/40" />
          )}

          {previewCorners && (
            <ReviewDocumentEdgeOverlay
              corners={previewCorners}
              onCornerChange={handlePreviewCornerChange}
            />
          )}

          {(status === "detecting" || status === "transforming") && (
            <div className="absolute inset-0 grid place-items-center bg-background/70 text-sm font-medium backdrop-blur-sm">
              {status === "transforming"
                ? "Applying correction..."
                : "Processing document..."}
            </div>
          )}
        </div>
      </div>

      <ReviewPrimaryActionBar
        createCorrectedImage={handleCreateCorrectedImage}
        createCorrectionPreview={handleCreateCorrectionPreview}
        currentPage={page}
        preview={preview}
        clearCorrectionPreview={() => setCorrectionPreview(null)}
        status={status}
      />
    </>
  );
}
