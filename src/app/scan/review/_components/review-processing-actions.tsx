import { Check, WandSparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDraftCurrentPage } from "../_hooks/use-draft-current-page";
import { useReviewProcessing } from "./review-processing-provider";

export function ReviewProcessingActions() {
  const currentPage = useDraftCurrentPage();
  const {
    errorMessage,
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

        {preview ? (
          <Button
            type="button"
            size="sm"
            onClick={replaceCurrentPage}
            className="flex-1 gap-1.5"
          >
            <Check className="size-4" />
            Apply
          </Button>
        ) : null}

        {preview ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={resetProcessingPreview}
            aria-label="Discard correction preview"
          >
            <X className="size-4" />
          </Button>
        ) : null}
      </div>

      {status === "failed" ? (
        <p className="px-1 text-xs text-destructive">
          {errorMessage ?? "Could not process the page."}
        </p>
      ) : null}
    </div>
  );
}
