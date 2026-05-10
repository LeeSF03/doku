"use client"

import {
  localDb,
  type StoredScanDraft,
  type StoredScanDraftPage,
  type StoredScanFilterId,
  type StoredScanPageRotation,
} from "@/lib/local-db"

export type SaveScanDraftPageInput = {
  id: string
  imageBlob: Blob
  order: number
  rotation: StoredScanPageRotation
  filter: StoredScanFilterId
}

export type LoadedScanDraft = StoredScanDraft & {
  pages: StoredScanDraftPage[]
}

export const ACTIVE_SCAN_DRAFT_ID = "active"

export async function getOrCreateActiveScanDraft() {
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

export async function loadActiveScanDraft(): Promise<LoadedScanDraft | null> {
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
}

export async function saveActiveScanDraftPage(input: SaveScanDraftPageInput) {
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
}

export async function updateActiveScanDraftName(name: string) {
  const draft = await getOrCreateActiveScanDraft()

  await localDb.drafts.update(draft.id, {
    name,
    updatedAt: Date.now(),
  })
}

export async function deleteActiveScanDraftPage(pageId: string) {
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
}

export async function clearActiveScanDraft() {
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
}
