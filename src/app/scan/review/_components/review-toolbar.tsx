import Link from "next/link";
import { Crop, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCurrentReviewPage } from "../_hooks/use-current-review-page";
import { useScanDraftActions } from "../../_providers/scan-provider";

export function ReviewToolbar() {
  const currentPage = useCurrentReviewPage();
  const { rotateCurrentPage } = useScanDraftActions();

  return (
    <div className="mt-5 flex items-center justify-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={rotateCurrentPage}
        disabled={!currentPage}
        className="gap-1.5"
      >
        <RotateCw className="size-4" />
        Rotate
      </Button>
      <Separator orientation="vertical" className="!h-5" />
      <Button variant="ghost" size="sm" className="gap-1.5">
        <Crop className="size-4" />
        Crop
      </Button>
      <Separator orientation="vertical" className="!h-5" />
      <Button asChild variant="ghost" size="sm" className="gap-1.5">
        <Link href="/scan">Retake</Link>
      </Button>
    </div>
  );
}
