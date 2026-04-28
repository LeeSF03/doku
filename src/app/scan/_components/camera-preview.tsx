import { type RefObject } from "react";
import { type CameraPreviewState } from "../_hooks/use-camera-preview";
import { ScanFrame } from "./scan-frame";

type CameraPreviewProps = {
  previewState: CameraPreviewState;
  videoRef: RefObject<HTMLVideoElement | null>;
};

export function CameraPreview({ previewState, videoRef }: CameraPreviewProps) {
  return (
    <div className="relative flex-1 overflow-hidden">
      <div className="absolute inset-0 bg-black" />

      <div className="absolute inset-x-6 inset-y-20 flex items-center justify-center">
        <ScanFrame previewState={previewState}>
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
