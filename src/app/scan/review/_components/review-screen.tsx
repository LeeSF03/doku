"use client"

import { useQueryState } from "nuqs"

import { useScanDraftStore } from "../../_providers/scan-provider"
import { ReviewHeader } from "./review-header"
import { ReviewPageCarousel } from "./review-page-carousel"
import { ReviewPreview } from "./review-preview"
import { ReviewSaveBar } from "./review-save-bar"
import { ReviewToolbar } from "./review-toolbar"

export function ReviewScreen() {
  const [draftPageId, setDraftPageId] = useQueryState("draft-page-id")
  const currentPage = useScanDraftStore((state) => {
    if (!draftPageId) return state.pages.at(-1) ?? null

    return (
      state.pages.find((page) => page.id === draftPageId) ??
      state.pages.at(-1) ??
      null
    )
  })

  return (
    <div className="bg-background flex min-h-dvh flex-col">
      <ReviewHeader />

      <main className="flex-1 px-5 pt-4 pb-48">
        <ReviewPreview key={currentPage?.id} page={currentPage} />
        <ReviewPageCarousel
          selectedPageId={currentPage?.id ?? null}
          setSelectedPageId={setDraftPageId}
        />
        <ReviewToolbar currentPage={currentPage} />
      </main>

      <ReviewSaveBar />
    </div>
  )
}
