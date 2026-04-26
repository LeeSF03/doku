import {
  type CameraState,
} from "../_hooks/use-camera-preview";
import { type RefObject } from "react";
import { useScanDraftStore } from "../_providers/scan-provider";
import { ScanFrame } from "./scan-frame";

type CameraPreviewProps = {
  cameraErrorMessage: string | null;
  cameraState: CameraState;
  videoRef: RefObject<HTMLVideoElement | null>;
};

export function CameraPreview({
  cameraErrorMessage,
  cameraState,
  videoRef,
}: CameraPreviewProps) {
  const auto = useScanDraftStore((state) => state.auto);
  const guidanceMessage = getGuidanceMessage({
    auto,
    cameraErrorMessage,
    cameraState,
  });

  return (
    <div className="relative flex-1 overflow-hidden">
      <div className="absolute inset-0 bg-black" />

      <div className="absolute inset-x-6 inset-y-20 flex items-center justify-center">
        <ScanFrame cameraState={cameraState} guidanceMessage={guidanceMessage}>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          />
        </ScanFrame>
      </div>
    </div>
  );
}

function getGuidanceMessage({
  auto,
  cameraErrorMessage,
  cameraState,
}: {
  auto: boolean;
  cameraErrorMessage: string | null;
  cameraState: CameraState;
}) {
  if (cameraState === "loading") return "Starting camera…";

  if (cameraState === "error")
    return cameraErrorMessage ?? "Allow camera access to scan documents.";

  if (auto) return "Move closer until the page fills the frame";

  return "Tap shutter to capture";
}
