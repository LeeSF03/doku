"use client";

import { ReviewAddPageButton } from "./review-add-page-button";
import { ReviewFilterTabs } from "./review-filter-tabs";
import { ReviewHeader } from "./review-header";
import { ReviewPreview } from "./review-preview";
import { ReviewSaveBar } from "./review-save-bar";
import { ReviewToolbar } from "./review-toolbar";

export function ReviewScreen() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <ReviewHeader />

      <main className="flex-1 px-5 pb-48 pt-4">
        <ReviewPreview />
        <ReviewToolbar />
        <ReviewFilterTabs />
        <ReviewAddPageButton />
      </main>

      <ReviewSaveBar />
    </div>
  );
}
