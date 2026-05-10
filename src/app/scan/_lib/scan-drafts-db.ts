"use client"

import {
  type StoredScanDraft,
  type StoredScanDraftPage,
  type StoredScanFilterId,
  type StoredScanPageRotation,
  localDb,
} from "@/lib/local-db"

export type ScanDraftId = string

export async function loadScanDraft(draftId: ScanDraftId) {
  try {
    const draft = await localDb.drafts.get(draftId)

    if (!draft) return null

    const pages = await localDb.draftPages
      .where("draftId")
      .equals(draftId)
      .sortBy("order")

    return {
      ...draft,
      pages,
    }
  } catch (error) {
    logPersistError(error)
    return null
  }
}

export async function listScanDrafts() {
  try {
    const drafts = await localDb.drafts.orderBy("updatedAt").reverse().toArray()

    return Promise.all(
      drafts.map(async (draft) => {
        const pages = await localDb.draftPages
          .where("draftId")
          .equals(draft.id)
          .sortBy("order")

        return {
          ...draft,
          pageCount: pages.length,
          thumbnailBlob: pages[0]?.imageBlob ?? null,
        }
      })
    )
  } catch (error) {
    logPersistError(error)
    return []
  }
}

export async function saveScanDraft(input: {
  id: ScanDraftId
  name: string
  pages: Array<{
    id: string
    imageBlob: Blob
    order: number
    rotation: StoredScanPageRotation
    filter: StoredScanFilterId
  }>
}) {
  try {
    const now = Date.now()
    const draft = {
      id: input.id,
      name: input.name,
      createdAt: now,
      updatedAt: now,
    } satisfies StoredScanDraft
    const pages = input.pages.map((page) => ({
      ...page,
      draftId: input.id,
      createdAt: now,
      updatedAt: now,
    })) satisfies StoredScanDraftPage[]

    await localDb.transaction(
      "rw",
      localDb.drafts,
      localDb.draftPages,
      async () => {
        await localDb.drafts.put(draft)
        await localDb.draftPages.bulkPut(pages)
      }
    )
  } catch (error) {
    logPersistError(error)
  }
}

export async function deleteScanDraft(draftId: ScanDraftId) {
  try {
    await localDb.transaction(
      "rw",
      localDb.drafts,
      localDb.draftPages,
      async () => {
        await localDb.draftPages.where("draftId").equals(draftId).delete()
        await localDb.drafts.delete(draftId)
      }
    )
  } catch (error) {
    logPersistError(error)
  }
}

function logPersistError(error: unknown) {
  console.warn("[scan-draft] Could not persist draft.", error)
}
