import { useRouter } from "next/navigation";
import { useState } from "react";
import { Images } from "lucide-react";
import { useQueryState } from "nuqs";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { type CameraState } from "../_hooks/use-camera-preview";
import {
  useScanDraftActions,
  useScanDraftStore,
} from "../_providers/scan-provider";

type ScanFooterProps = {
  cameraState: CameraState;
  captureFrame: () => Promise<Blob>;
};

export function ScanFooter({ cameraState, captureFrame }: ScanFooterProps) {
  const router = useRouter();
  const [replacePageId] = useQueryState("replace-page-id");
  const [capturePending, setCapturePending] = useState(false);
  const pageCount = useScanDraftStore((state) => state.pages.length);
  const { appendPage, upsertPage } = useScanDraftActions();

  const handleCapture = async () => {
    setCapturePending(true);

    try {
      const blob = await captureFrame();
      const imageUrl = URL.createObjectURL(blob);
      const page = {
        id: replacePageId ?? crypto.randomUUID(),
        imageUrl,
        rotation: 0,
        filter: "original" as const,
      };

      if (replacePageId) {
        upsertPage(page);
      } else {
        appendPage(page);
      }

      router.push(`/scan/review?draft-page-id=${encodeURIComponent(page.id)}`);
    } catch (error) {
      toast.error("Could not capture page", {
        description:
          error instanceof Error ? error.message : "Try again in a moment.",
      });
    } finally {
      setCapturePending(false);
    }
  };

  return (
    <div className="grid grid-cols-3 items-center">
      <div className="flex justify-start">
        <Button
          variant="ghost"
          size="icon-lg"
          aria-label="Open gallery"
          className="rounded-xl text-white hover:bg-white/10 hover:text-white"
        >
          <Images className="size-6" />
        </Button>
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={handleCapture}
          disabled={cameraState !== "ready" || capturePending}
          aria-label="Capture"
          className="group relative grid size-20 place-items-center rounded-full outline-none transition-opacity focus-visible:ring-4 focus-visible:ring-white/30 disabled:pointer-events-none disabled:opacity-50"
        >
          <span className="absolute inset-0 rounded-full border-4 border-white" />
          <span className="size-15 rounded-full bg-white transition-transform group-active:scale-90" />
        </button>
      </div>

      <div className="flex justify-end">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl text-xs font-medium text-white/80">
          {pageCount}
        </div>
      </div>
    </div>
  );
}
