"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import {
  type ScanDraftPage,
  useScanDraftActions,
} from "../../_providers/scan-provider";
import {
  type DocumentCorners,
  type DocumentPoint,
  processDocumentImage,
  transformDocumentImage,
} from "../_lib/process-document-image";

type ProcessingStatus = "idle" | "processing" | "ready" | "applying" | "failed";

type ProcessingPreview = {
  corners: DocumentCorners;
  sourcePageId: string;
  imageUrl: string;
};

type ReviewProcessingContextValue = {
  preview: ProcessingPreview | null;
  processCurrentPage: () => Promise<void>;
  replaceCurrentPage: () => Promise<void>;
  resetProcessingPreview: () => void;
  status: ProcessingStatus;
  updatePreviewCorner: (cornerIndex: number, point: DocumentPoint) => void;
};

const ReviewProcessingContext =
  createContext<ReviewProcessingContextValue | null>(null);

export function ReviewProcessingProvider({
  children,
  currentPage,
}: {
  children: ReactNode;
  currentPage: ScanDraftPage | null;
}) {
  const { replacePageImage } = useScanDraftActions();
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [preview, setPreview] = useState<ProcessingPreview | null>(null);
  const previewRef = useRef<ProcessingPreview | null>(null);

  function setProcessingPreview(nextPreview: ProcessingPreview | null) {
    previewRef.current = nextPreview;
    setPreview(nextPreview);
  }

  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current.imageUrl);
    };
  }, []);

  async function processCurrentPage() {
    if (!currentPage || status === "processing") return;

    setStatus("processing");

    try {
      const processedImage = await processDocumentImage(currentPage.imageUrl);
      const imageUrl = URL.createObjectURL(processedImage.blob);

      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current.imageUrl);
      }
      setProcessingPreview({
        corners: processedImage.corners,
        sourcePageId: currentPage.id,
        imageUrl,
      });
      setStatus("ready");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not process this document.";

      setStatus("failed");
      toast.error("Document processing failed", {
        description: message,
      });
    }
  }

  async function replaceCurrentPage() {
    if (!preview || status === "applying") return;

    setStatus("applying");

    try {
      const transformedImage = await transformDocumentImage(
        preview.imageUrl,
        preview.corners,
      );
      const transformedImageUrl = URL.createObjectURL(transformedImage);

      replacePageImage(preview.sourcePageId, transformedImageUrl);
      URL.revokeObjectURL(preview.imageUrl);
      setProcessingPreview(null);
      setStatus("idle");
      toast.success("Current page replaced");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not transform this document.";

      setStatus("failed");
      toast.error("Document transform failed", {
        description: message,
      });
    }
  }

  function resetProcessingPreview() {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current.imageUrl);
    }
    setProcessingPreview(null);
    setStatus("idle");
  }

  function updatePreviewCorner(cornerIndex: number, point: DocumentPoint) {
    if (!previewRef.current) return;

    const nextPreview = {
      ...previewRef.current,
      corners: previewRef.current.corners.map((corner, index) =>
        index === cornerIndex ? clampPoint(point) : corner,
      ) as DocumentCorners,
    };

    setProcessingPreview(nextPreview);
  }

  return (
    <ReviewProcessingContext.Provider
      value={{
        preview,
        processCurrentPage,
        replaceCurrentPage,
        resetProcessingPreview,
        status,
        updatePreviewCorner,
      }}
    >
      {children}
    </ReviewProcessingContext.Provider>
  );
}

export function useReviewProcessing() {
  const context = useContext(ReviewProcessingContext);

  if (!context) {
    throw new Error(
      "useReviewProcessing must be used within ReviewProcessingProvider.",
    );
  }

  return context;
}

function clampPoint(point: DocumentPoint): DocumentPoint {
  return {
    x: Math.min(1, Math.max(0, point.x)),
    y: Math.min(1, Math.max(0, point.y)),
  };
}
