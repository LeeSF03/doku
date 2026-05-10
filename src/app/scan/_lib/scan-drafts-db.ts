"use client"

import {
  type StoredScanDraft,
  type StoredScanFilterId,
  type StoredScanPageRotation,
  localDb,
} from "@/lib/local-db"

export const ACTIVE_SCAN_DRAFT_ID = "active"
export type ScanDraftId = typeof ACTIVE_SCAN_DRAFT_ID | (string & {})

async function getOrCreateScanDraft(draftId: ScanDraftId) {
  const existingDraft = await localDb.drafts.get(draftId)

  if (existingDraft) return existingDraft

  const now = Date.now()
  const draft = {
    id: draftId,
    name: "",
    createdAt: now,
    updatedAt: now,
  } satisfies StoredScanDraft

  await localDb.drafts.put(draft)

  return draft
}

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

export async function saveScanDraftPage(draftId: ScanDraftId, input: {
  id: string
  imageBlob: Blob
  order: number
  rotation: StoredScanPageRotation
  filter: StoredScanFilterId
}) {
  try {
    const draft = await getOrCreateScanDraft(draftId)
    const existingPage = await localDb.draftPages.get(input.id)
    const now = Date.now()

    await localDb.transaction(
      "rw",
      localDb.drafts,
      localDb.draftPages,
      async () => {
        await localDb.draftPages.put({
          ...input,
          draftId: draft.id,
          createdAt: existingPage?.createdAt ?? now,
          updatedAt: now,
        })
        await localDb.drafts.update(draft.id, {
          updatedAt: now,
        })
      }
    )
  } catch (error) {
    logPersistError(error)
  }
}

export async function updateScanDraftName(draftId: ScanDraftId, name: string) {
  try {
    const draft = await getOrCreateScanDraft(draftId)

    await localDb.drafts.update(draft.id, {
      name,
      updatedAt: Date.now(),
    })
  } catch (error) {
    logPersistError(error)
  }
}

export async function finalizeScanDraft(input: {
  sourceDraftId: ScanDraftId
  targetDraftId: ScanDraftId
  name: string
}) {
  try {
    const draft = await localDb.drafts.get(input.sourceDraftId)

    if (!draft) return

    const pages = await localDb.draftPages
      .where("draftId")
      .equals(input.sourceDraftId)
      .toArray()
    const now = Date.now()

    await localDb.transaction(
      "rw",
      localDb.drafts,
      localDb.draftPages,
      async () => {
        await localDb.drafts.delete(input.sourceDraftId)
        await localDb.drafts.put({
          ...draft,
          id: input.targetDraftId,
          name: input.name,
          updatedAt: now,
        })

        await Promise.all(
          pages.map((page) =>
            localDb.draftPages.put({
              ...page,
              draftId: input.targetDraftId,
              updatedAt: now,
            })
          )
        )
      }
    )
  } catch (error) {
    logPersistError(error)
  }
}

export async function updateScanDraftPage(draftId: ScanDraftId, input: {
  id: string
  order?: number
  rotation?: StoredScanPageRotation
  filter?: StoredScanFilterId
}) {
  try {
    const draft = await getOrCreateScanDraft(draftId)
    const { id, ...changes } = input
    const now = Date.now()

    await localDb.transaction(
      "rw",
      localDb.drafts,
      localDb.draftPages,
      async () => {
        await localDb.draftPages.update(id, {
          ...changes,
          updatedAt: now,
        })
        await localDb.drafts.update(draft.id, {
          updatedAt: now,
        })
      }
    )
  } catch (error) {
    logPersistError(error)
  }
}

export async function deleteScanDraftPage(draftId: ScanDraftId, pageId: string) {
  try {
    const draft = await getOrCreateScanDraft(draftId)

    await localDb.transaction(
      "rw",
      localDb.drafts,
      localDb.draftPages,
      async () => {
        await localDb.draftPages.delete(pageId)
        await localDb.drafts.update(draft.id, {
          updatedAt: Date.now(),
        })
      }
    )
  } catch (error) {
    logPersistError(error)
  }
}

export async function clearScanDraft(draftId: ScanDraftId) {
  try {
    await localDb.transaction(
      "rw",
      localDb.drafts,
      localDb.draftPages,
      async () => {
        await localDb.draftPages
          .where("draftId")
          .equals(draftId)
          .delete()
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
