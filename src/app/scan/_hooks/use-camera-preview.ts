"use client";

import { useEffect, useRef, useState } from "react";

export type CameraState = "loading" | "ready" | "error";

type TorchMediaTrackCapabilities = MediaTrackCapabilities & {
  torch?: boolean;
};

type TorchMediaTrackConstraints = MediaTrackConstraints & {
  advanced?: TorchMediaTrackConstraintSet[];
};

type TorchMediaTrackConstraintSet = MediaTrackConstraintSet & {
  torch?: boolean;
};

export function useCameraPreview() {
  const [cameraState, setCameraState] = useState<CameraState>("loading");
  const [cameraErrorMessage, setCameraErrorMessage] = useState<string | null>(
    null,
  );
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [flashSupported, setFlashSupported] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const captureFrame = async () => {
    const video = videoRef.current;

    if (!video || cameraState !== "ready") {
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

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.92);
    });

    if (!blob) {
      throw new Error("Could not capture a camera frame.");
    }

    return blob;
  };

  const toggleFlash = async () => {
    const track = streamRef.current?.getVideoTracks()[0] ?? null;

    if (!track || !flashSupported) {
      throw new Error("Flash is not supported on this camera.");
    }

    const nextFlashEnabled = !flashEnabled;

    await track.applyConstraints({
      advanced: [
        {
          torch: nextFlashEnabled,
        },
      ],
    } as TorchMediaTrackConstraints);
    setFlashEnabled(nextFlashEnabled);
  };

  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraState("error");
        setCameraErrorMessage(
          "Camera preview is not supported in this browser.",
        );
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: "environment" },
          },
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        setFlashEnabled(false);
        setFlashSupported(() => {
          const track = streamRef.current?.getVideoTracks()[0] ?? null;

          if (!track?.getCapabilities) return false;

          const capabilities =
            track.getCapabilities() as TorchMediaTrackCapabilities;
          return capabilities.torch === true;
        });

        if (videoRef.current) {
          videoRef.current.srcObject = streamRef.current;
          await videoRef.current.play().catch(() => undefined);
        }

        setCameraState("ready");
        setCameraErrorMessage(null);
      } catch {
        setCameraState("error");
        setCameraErrorMessage("Allow camera access to scan documents.");
      }
    }

    void startCamera();

    return () => {
      cancelled = true;
      setFlashEnabled(false);
      setFlashSupported(false);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

  return {
    captureFrame,
    cameraErrorMessage,
    cameraState,
    flashEnabled,
    flashSupported,
    toggleFlash,
    videoRef,
  };
}
