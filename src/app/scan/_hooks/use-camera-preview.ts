"use client";

import { useEffect, useRef, useState } from "react";
import { canvasToBlob } from "@/lib/canvas";

export type CameraPreviewState =
  | "loading"
  | "permission-denied"
  | "ready"
  | "unavailable"
  | "unsupported";

interface TorchMediaTrackCapabilities extends MediaTrackCapabilities {
  torch?: boolean;
}

interface TorchMediaTrackConstraints extends MediaTrackConstraints {
  advanced?: TorchMediaTrackConstraintSet[];
}

interface TorchMediaTrackConstraintSet extends MediaTrackConstraintSet {
  torch?: boolean;
}

type FlashState = "off" | "on" | "unsupported";

export function useCameraPreview() {
  const [previewState, setPreviewState] =
    useState<CameraPreviewState>("loading");
  const [flashState, setFlashState] = useState<FlashState>("unsupported");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const flashEnabled = flashState === "on";
  const flashSupported = flashState !== "unsupported";

  const captureFrame = async () => {
    const video = videoRef.current;

    if (!video || previewState !== "ready") {
      throw new Error("Camera is not ready.");
    }

    const width = video.videoWidth;
    const height = video.videoHeight;

    if (!width || !height) {
      throw new Error("Camera frame is not available yet.");
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Canvas capture is not supported in this browser.");
    }

    context.drawImage(video, 0, 0, width, height);

    return canvasToBlob(canvas, {
      quality: 0.92,
      type: "image/jpeg",
    });
  };

  const toggleFlash = async () => {
    const track = streamRef.current?.getVideoTracks()[0] ?? null;

    if (!track || flashState === "unsupported") {
      throw new Error("Flash is not supported on this camera.");
    }

    const nextFlashEnabled = flashState !== "on";

    await track.applyConstraints({
      advanced: [
        {
          torch: nextFlashEnabled,
        },
      ],
    } as TorchMediaTrackConstraints);
    setFlashState(nextFlashEnabled ? "on" : "off");
  };

  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setPreviewState("unsupported");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: "environment" },
            height: { ideal: 1920 },
            width: { ideal: 2560 },
          },
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        setFlashState(() => {
          const track = streamRef.current?.getVideoTracks()[0] ?? null;

          if (!track?.getCapabilities) return "unsupported";

          const capabilities =
            track.getCapabilities() as TorchMediaTrackCapabilities;
          return capabilities.torch === true ? "off" : "unsupported";
        });

        if (videoRef.current) {
          videoRef.current.srcObject = streamRef.current;
          await videoRef.current.play().catch(() => undefined);
        }

        setPreviewState("ready");
      } catch (error) {
        setPreviewState(
          error instanceof DOMException && error.name === "NotAllowedError"
            ? "permission-denied"
            : "unavailable",
        );
      }
    }

    void startCamera();

    return () => {
      cancelled = true;
      setFlashState("unsupported");
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

  return {
    captureFrame,
    flashEnabled,
    flashSupported,
    previewState,
    toggleFlash,
    videoRef,
  };
}
