import { Check, WandSparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type ScanDraftPage } from "../../_providers/scan-provider";
import { useReviewProcessing } from "./review-processing-provider";

export function ReviewProcessingActions({
  currentPage,
}: {
  currentPage: ScanDraftPage | null;
}) {
  const {
    preview,
    processCurrentPage,
    replaceCurrentPage,
    resetProcessingPreview,
    status,
  } = useReviewProcessing();
  const processing = status === "processing";

  return (
    <div className="mt-4 space-y-2">
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={processCurrentPage}
          disabled={!currentPage || processing}
          className="flex-1 gap-1.5"
        >
          <WandSparkles className="size-4" />
          {processing ? "Processing" : "Correct"}
        </Button>

        {preview && (
          <>
            <Button
              type="button"
              size="sm"
              onClick={replaceCurrentPage}
              className="flex-1 gap-1.5"
            >
              <Check className="size-4" />
              Apply
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={resetProcessingPreview}
              aria-label="Discard correction preview"
            >
              <X className="size-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
