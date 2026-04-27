"use client";

import { useCameraPreview } from "../_hooks/use-camera-preview";
import { CameraPreview } from "./camera-preview";
import { ScanFooter } from "./scan-footer";
import { ScanHeader } from "./scan-header";

export function ScanScreen() {
  const { captureFrame, cameraErrorMessage, cameraState, videoRef } =
    useCameraPreview();

  return (
    <div className="dark fixed inset-0 flex flex-col bg-black text-white">
      <ScanHeader />

      <CameraPreview
        cameraErrorMessage={cameraErrorMessage}
        cameraState={cameraState}
        videoRef={videoRef}
      />

      <div className="px-4 pb-[max(env(safe-area-inset-bottom),1.25rem)] pt-3">
        <ScanFooter cameraState={cameraState} captureFrame={captureFrame} />
      </div>
    </div>
  );
}
