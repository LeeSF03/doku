"use client"

import Dexie, { type Table } from "dexie"

import {
  ScanFilterId,
  ScanPageRotation,
} from "@/app/scan/_providers/scan-provider"

export type StoredScanFilterId = ScanFilterId
export type StoredScanPageRotation = ScanPageRotation

export type StoredScanDraft = {
  id: string
  name: string
  createdAt: number
  updatedAt: number
}

export type StoredScanDraftPage = {
  id: string
  draftId: string
  imageBlob: Blob
  order: number
  rotation: StoredScanPageRotation
  filter: StoredScanFilterId
  createdAt: number
  updatedAt: number
}

class DokuLocalDb extends Dexie {
  drafts!: Table<StoredScanDraft, string>
  draftPages!: Table<StoredScanDraftPage, string>

  constructor() {
    super("doku-local")

    this.version(1).stores({
      drafts: "id, updatedAt, createdAt",
      draftPages: "id, draftId, order, updatedAt",
    })
  }
}

export const localDb = new DokuLocalDb()
