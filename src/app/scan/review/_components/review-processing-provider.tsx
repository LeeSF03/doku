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
import { useScanDraftActions } from "../../_providers/scan-provider";
import { processDocumentImage } from "../_lib/process-document-image";
import { useDraftCurrentPage } from "../_hooks/use-draft-current-page";

type ProcessingStatus = "idle" | "processing" | "ready" | "failed";

type ProcessingPreview = {
  sourcePageId: string;
  imageUrl: string;
};

type ReviewProcessingContextValue = {
  errorMessage: string | null;
  preview: ProcessingPreview | null;
  processCurrentPage: () => Promise<void>;
  replaceCurrentPage: () => void;
  resetProcessingPreview: () => void;
  status: ProcessingStatus;
};

const ReviewProcessingContext =
  createContext<ReviewProcessingContextValue | null>(null);

export function ReviewProcessingProvider({
  children,
}: {
  children: ReactNode;
}) {
  const currentPage = useDraftCurrentPage();

  return (
    <ReviewProcessingProviderInner key={currentPage?.id ?? "empty"}>
      {children}
    </ReviewProcessingProviderInner>
  );
}

function ReviewProcessingProviderInner({ children }: { children: ReactNode }) {
  const currentPage = useDraftCurrentPage();
  const { replacePageImage } = useScanDraftActions();
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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
    setErrorMessage(null);

    try {
      const blob = await processDocumentImage(currentPage.imageUrl);
      const imageUrl = URL.createObjectURL(blob);

      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current.imageUrl);
      }
      setProcessingPreview({
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
      setErrorMessage(message);
      toast.error("Document processing failed", {
        description: message,
      });
    }
  }

  function replaceCurrentPage() {
    if (!preview) return;

    replacePageImage(preview.sourcePageId, preview.imageUrl);
    setProcessingPreview(null);
    setStatus("idle");
    setErrorMessage(null);
    toast.success("Current page replaced");
  }

  function resetProcessingPreview() {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current.imageUrl);
    }
    setProcessingPreview(null);
    setStatus("idle");
    setErrorMessage(null);
  }

  return (
    <ReviewProcessingContext.Provider
      value={{
        errorMessage,
        preview,
        processCurrentPage,
        replaceCurrentPage,
        resetProcessingPreview,
        status,
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
