"use client"

import { useEffect, useState } from "react"

import { DraftGrid } from "./_components/draft-grid"
import { HomeHeader } from "./_components/home-header"
import { ScanDocumentButton } from "./_components/scan-document-button"
import { clearScanDraft, listScanDrafts } from "./scan/_lib/scan-drafts-db"

type DraftCard = Awaited<ReturnType<typeof listScanDrafts>>[number] & {
  thumbnailUrl: string | null
}

export default function Home() {
  const [drafts, setDrafts] = useState<DraftCard[]>([])

  useEffect(() => {
    const thumbnailUrls: string[] = []
    let cancelled = false

    listScanDrafts().then((storedDrafts) => {
      if (cancelled) return

      const nextDrafts = storedDrafts.map((draft) => {
        const thumbnailUrl = draft.thumbnailBlob
          ? URL.createObjectURL(draft.thumbnailBlob)
          : null

        if (thumbnailUrl) thumbnailUrls.push(thumbnailUrl)

        return {
          ...draft,
          thumbnailUrl,
        }
      })

      setDrafts(nextDrafts)
    })

    return () => {
      cancelled = true
      thumbnailUrls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [])

  async function handleDeleteDraft(draft: DraftCard) {
    await clearScanDraft(draft.id)

    if (draft.thumbnailUrl) URL.revokeObjectURL(draft.thumbnailUrl)

    setDrafts((currentDrafts) =>
      currentDrafts.filter((currentDraft) => currentDraft.id !== draft.id)
    )
  }

  return (
    <div className="bg-background flex min-h-dvh flex-col">
      <HomeHeader draftCount={drafts.length} />

      <main className="flex-1 px-5 pt-4 pb-32">
        <DraftGrid drafts={drafts} onDeleteDraft={handleDeleteDraft} />
      </main>

      <ScanDocumentButton />
    </div>
  )
}
