"use client";

import { useCameraPreview } from "../_hooks/use-camera-preview";
import { CameraPreview } from "./camera-preview";
import { ScanFooter } from "./scan-footer";
import { ScanHeader } from "./scan-header";

export function ScanScreen() {
  const {
    captureFrame,
    flashEnabled,
    flashSupported,
    previewState,
    toggleFlash,
    videoRef,
  } = useCameraPreview();

  return (
    <div className="dark fixed inset-0 flex flex-col bg-black text-white">
      <ScanHeader
        flashEnabled={flashEnabled}
        flashSupported={flashSupported}
        previewState={previewState}
        toggleFlash={toggleFlash}
      />

      <CameraPreview
        previewState={previewState}
        videoRef={videoRef}
      />

      <div className="px-4 pb-[max(env(safe-area-inset-bottom),1.25rem)] pt-3">
        <ScanFooter captureFrame={captureFrame} previewState={previewState} />
      </div>
    </div>
  );
}
