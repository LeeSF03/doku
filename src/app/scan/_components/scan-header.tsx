import Link from "next/link";
import { Sparkles, X, Zap, ZapOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { type CameraState } from "../_hooks/use-camera-preview";
import {
  useScanDraftActions,
  useScanDraftStore,
} from "../_providers/scan-provider";

type ScanHeaderProps = {
  cameraState: CameraState;
  flashEnabled: boolean;
  flashSupported: boolean;
  toggleFlash: () => Promise<void>;
};

export function ScanHeader({
  cameraState,
  flashEnabled,
  flashSupported,
  toggleFlash,
}: ScanHeaderProps) {
  const auto = useScanDraftStore((state) => state.auto);
  const { toggleAuto } = useScanDraftActions();
  const flashDisabled = cameraState !== "ready" || !flashSupported;

  const handleToggleFlash = async () => {
    try {
      await toggleFlash();
    } catch (error) {
      toast.error("Could not toggle flash", {
        description:
          error instanceof Error ? error.message : "Try again in a moment.",
      });
    }
  };

  return (
    <div className="flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),1rem)] pb-3">
      <Button
        asChild
        variant="ghost"
        size="icon"
        className="rounded-full text-white hover:bg-white/10 hover:text-white"
      >
        <Link href="/" aria-label="Close scanner">
          <X />
        </Link>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={toggleAuto}
        className="h-8 gap-1.5 rounded-full bg-white/10 px-3 text-xs font-medium text-white hover:bg-white/20 hover:text-white"
      >
        <Sparkles className="size-3.5" />
        {auto ? "Auto" : "Manual"}
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={handleToggleFlash}
        disabled={flashDisabled}
        aria-label={flashEnabled ? "Disable flash" : "Enable flash"}
        className="rounded-full text-white hover:bg-white/10 hover:text-white disabled:text-muted-foreground/50 disabled:opacity-100"
      >
        {flashEnabled ? (
          <Zap className="fill-yellow-300 text-yellow-300" />
        ) : (
          <ZapOff />
        )}
      </Button>
    </div>
  );
}
