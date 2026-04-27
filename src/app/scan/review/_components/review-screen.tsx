"use client";

import { useQueryState } from "nuqs";
import { useScanDraftStore } from "../../_providers/scan-provider";
import { ReviewFilterTabs } from "./review-filter-tabs";
import { ReviewHeader } from "./review-header";
import { ReviewPageCarousel } from "./review-page-carousel";
import { ReviewPreview } from "./review-preview";
import { ReviewProcessingProvider } from "./review-processing-provider";
import { ReviewSaveBar } from "./review-save-bar";
import { ReviewToolbar } from "./review-toolbar";

export function ReviewScreen() {
  const [draftPageId] = useQueryState("draft-page-id");
  const currentPage = useScanDraftStore((state) => {
    if (!draftPageId) return state.pages.at(-1) ?? null;

    return (
      state.pages.find((page) => page.id === draftPageId) ??
      state.pages.at(-1) ??
      null
    );
  });

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <ReviewHeader />

      <main className="flex-1 px-5 pb-48 pt-4">
        <ReviewProcessingProvider currentPage={currentPage}>
          <ReviewPreview page={currentPage} />
        </ReviewProcessingProvider>
        <ReviewPageCarousel />
        <ReviewToolbar currentPage={currentPage} />
        <ReviewFilterTabs page={currentPage} />
      </main>

      <ReviewSaveBar />
    </div>
  );
}
