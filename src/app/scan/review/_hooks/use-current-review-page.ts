"use client";

import { useScanDraftStore } from "../../_providers/scan-provider";

export function useCurrentReviewPage() {
  return useScanDraftStore((state) => {
    const currentPageId = state.currentPageId;

    if (!currentPageId) return state.pages.at(-1) ?? null;

    return state.pages.find((page) => page.id === currentPageId) ?? null;
  });
}
