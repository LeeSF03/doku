import { WandSparkles, X } from "lucide-react";
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

  return (
    <div className="mt-4 rounded-xl border bg-card p-3 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Document correction</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {getProcessingMessage(status, Boolean(preview), errorMessage)}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={processCurrentPage}
          disabled={!currentPage || status === "processing"}
          className="shrink-0 gap-1.5"
        >
          <WandSparkles className="size-4" />
          {status === "processing" ? "Processing" : "Process"}
        </Button>
      </div>

      {preview ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button type="button" onClick={replaceCurrentPage}>
            Replace current
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={resetProcessingPreview}
            className="gap-1.5"
          >
            <X className="size-4" />
            Keep original
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function getProcessingMessage(
  status: "idle" | "processing" | "ready" | "failed",
  hasPreview: boolean,
  errorMessage: string | null
) {
  if (status === "processing") return "Preparing a corrected preview...";
  if (hasPreview) return "Preview ready. Replace only if it looks better.";
  if (status === "failed") return errorMessage ?? "Could not process the page.";

  return "Create a corrected preview before replacing the draft page.";
}
