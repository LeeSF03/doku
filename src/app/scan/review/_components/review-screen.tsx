"use client"

import { useEffect } from "react"

import { useRouter } from "next/navigation"

import { useQueryState } from "nuqs"
import { toast } from "sonner"

import { loadScanDraft } from "../../_lib/scan-drafts-db"
import {
  useScanDraftActions,
  useScanDraftStore,
} from "../../_providers/scan-provider"
import { ReviewHeader } from "./review-header"
import { ReviewPageCarousel } from "./review-page-carousel"
import { ReviewPreview } from "./review-preview"
import { ReviewSaveBar } from "./review-save-bar"
import { ReviewToolbar } from "./review-toolbar"

export function ReviewScreen() {
  const router = useRouter()
  const { restoreDraft } = useScanDraftActions()
  const [draftId] = useQueryState("draft-id")
  const [draftPageId, setDraftPageId] = useQueryState("draft-page-id")
  const hydratedDraftId = useScanDraftStore((state) => state.draftId)
  const currentPage = useScanDraftStore((state) => {
    if (!draftPageId) return state.pages[0] ?? null

    return (
      state.pages.find((page) => page.id === draftPageId) ??
      state.pages[0] ??
      null
    )
  })

  useEffect(() => {
    if (!draftId || hydratedDraftId === draftId) return

    let cancelled = false

    loadScanDraft(draftId)
      .then((draft) => {
        if (cancelled) return

        if (!draft) {
          toast.error("Could not load draft", {
            description: "The draft may have been deleted.",
          })
          router.replace("/")
          return
        }

        const pages = draft.pages.map((page) => ({
          id: page.id,
          imageUrl: URL.createObjectURL(page.imageBlob),
          rotation: page.rotation,
          filter: page.filter,
        }))

        if (cancelled) {
          pages.forEach((page) => URL.revokeObjectURL(page.imageUrl))
          return
        }

        restoreDraft({
          draftId: draft.id,
          name: draft.name,
          pages,
        })
      })
      .catch((error: unknown) => {
        console.warn("[scan-draft] Could not load draft.", error)
        toast.error("Could not load draft", {
          description: "Try opening it again from the drafts page.",
        })
        router.replace("/")
      })

    return () => {
      cancelled = true
    }
  }, [draftId, hydratedDraftId, restoreDraft, router])

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
