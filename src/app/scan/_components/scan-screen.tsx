"use client";

import { useCameraPreview } from "../_hooks/use-camera-preview";
import { CameraPreview } from "./camera-preview";
import { ScanFooter } from "./scan-footer";
import { ScanHeader } from "./scan-header";
import { ScanModeTabs } from "./scan-mode-tabs";

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

      <div className="flex flex-col gap-5 px-4 pb-[max(env(safe-area-inset-bottom),1.25rem)] pt-3">
        <div className="flex justify-center">
          <ScanModeTabs />
        </div>

        <ScanFooter cameraState={cameraState} captureFrame={captureFrame} />
      </div>
    </div>
  );
}
