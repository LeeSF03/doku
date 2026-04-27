import { type ReactNode } from "react";
import { type CameraState } from "../_hooks/use-camera-preview";
import { cn } from "@/lib/utils";

type ScanFrameProps = {
  cameraState: CameraState;
  guidanceMessage: string;
  children: ReactNode;
};

export function ScanFrame({
  cameraState,
  guidanceMessage,
  children,
}: ScanFrameProps) {
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-3">
      <div className="relative aspect-3/4 w-full">
        <div className="absolute inset-0 overflow-hidden rounded-[28px] border border-white/12 bg-zinc-950">
          {children}
          <div className="absolute inset-0 bg-linear-to-b from-black/30 via-transparent to-black/35" />

          {cameraState !== "ready" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/55 px-6 text-center">
              <div className="space-y-2">
                <p className="text-sm font-medium text-white">
                  {cameraState === "loading"
                    ? "Opening camera"
                    : "Camera unavailable"}
                </p>
                <p className="text-xs leading-relaxed text-white/70">
                  {guidanceMessage}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="pointer-events-none absolute inset-3 rounded-3xl border border-white/8" />

        <Corner className="left-3 top-3" />
        <Corner className="right-3 top-3 rotate-90" />
        <Corner className="right-3 bottom-3 rotate-180" />
        <Corner className="left-3 bottom-3 -rotate-90" />
      </div>

      {cameraState === "ready" && (
        <p className="min-h-4 text-center text-xs text-white/60">
          {guidanceMessage}
        </p>
      )}
    </div>
  );
}

function Corner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "absolute h-8 w-8 rounded-tl-2xl border-l-2 border-t-2 border-white/75",
        className,
      )}
    />
  );
}
