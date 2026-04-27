import { useRouter } from "next/navigation";
import { Crop, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  type ScanDraftPage,
  useScanDraftActions,
} from "../../_providers/scan-provider";

export function ReviewToolbar({
  currentPage,
}: {
  currentPage: ScanDraftPage | null;
}) {
  const router = useRouter();
  const { rotatePage } = useScanDraftActions();

  const handleRetake = () => {
    if (!currentPage) return;

    router.push(`/scan?replace-page-id=${encodeURIComponent(currentPage.id)}`);
  };

  return (
    <div className="mt-5 flex items-center justify-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => currentPage && rotatePage(currentPage.id)}
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
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleRetake}
        disabled={!currentPage}
        className="gap-1.5"
      >
        Retake
      </Button>
    </div>
  );
}
