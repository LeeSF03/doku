"use client"

import {
  type StoredScanDraft,
  type StoredScanFilterId,
  type StoredScanPageRotation,
  localDb,
} from "@/lib/local-db"

export const ACTIVE_SCAN_DRAFT_ID = "active"

async function getOrCreateActiveScanDraft() {
  const existingDraft = await localDb.drafts.get(ACTIVE_SCAN_DRAFT_ID)

  if (existingDraft) return existingDraft

  const now = Date.now()
  const draft = {
    id: ACTIVE_SCAN_DRAFT_ID,
    name: "",
    createdAt: now,
    updatedAt: now,
  } satisfies StoredScanDraft

  await localDb.drafts.put(draft)

  return draft
}

export async function loadActiveScanDraft() {
  try {
    const draft = await localDb.drafts.get(ACTIVE_SCAN_DRAFT_ID)

    if (!draft) return null

    const pages = await localDb.draftPages
      .where("draftId")
      .equals(ACTIVE_SCAN_DRAFT_ID)
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

export async function saveActiveScanDraftPage(input: {
  id: string
  imageBlob: Blob
  order: number
  rotation: StoredScanPageRotation
  filter: StoredScanFilterId
}) {
  try {
    const draft = await getOrCreateActiveScanDraft()
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

export async function updateActiveScanDraftName(name: string) {
  try {
    const draft = await getOrCreateActiveScanDraft()

    await localDb.drafts.update(draft.id, {
      name,
      updatedAt: Date.now(),
    })
  } catch (error) {
    logPersistError(error)
  }
}

export async function updateActiveScanDraftPage(input: {
  id: string
  order?: number
  rotation?: StoredScanPageRotation
  filter?: StoredScanFilterId
}) {
  try {
    const draft = await getOrCreateActiveScanDraft()
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

export async function deleteActiveScanDraftPage(pageId: string) {
  try {
    const draft = await getOrCreateActiveScanDraft()

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

export async function clearActiveScanDraft() {
  try {
    await localDb.transaction(
      "rw",
      localDb.drafts,
      localDb.draftPages,
      async () => {
        await localDb.draftPages
          .where("draftId")
          .equals(ACTIVE_SCAN_DRAFT_ID)
          .delete()
        await localDb.drafts.delete(ACTIVE_SCAN_DRAFT_ID)
      }
    )
  } catch (error) {
    logPersistError(error)
  }
}

function logPersistError(error: unknown) {
  console.warn("[scan-draft] Could not persist draft.", error)
}
