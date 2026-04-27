"use client";

import { useQueryState } from "nuqs";
import { useScanDraftStore } from "../../_providers/scan-provider";

export function useDraftCurrentPage() {
  const [draftPageId] = useQueryState("draft-page-id");

  return useScanDraftStore((state) => {
    if (!draftPageId) return state.pages.at(-1) ?? null;

    return (
      state.pages.find((page) => page.id === draftPageId) ??
      state.pages.at(-1) ??
      null
    );
  });
}
