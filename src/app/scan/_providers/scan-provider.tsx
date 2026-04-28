"use client"

import { type ReactNode, createContext, useContext, useState } from "react"

import { minBy } from "es-toolkit"
import { useStore } from "zustand"
import { createStore } from "zustand/vanilla"

export type ScanFilterId = "original" | "bw" | "grayscale" | "color"
export type ScanPageRotation = 0 | 90 | 180 | 270
const scanPageRotationOption = [0, 90, 180, 270] as const

export type ScanDraftPage = {
  id: string
  imageUrl: string
  rotation: ScanPageRotation
  filter: ScanFilterId
}

type ScanDraftState = {
  draftId: string
  pages: ScanDraftPage[]
  actions: ScanDraftActions
}

type ScanDraftActions = {
  upsertPage: (page: ScanDraftPage) => void
  removePage: (pageId: string) => void
  replacePageImage: (pageId: string, imageUrl: string) => void
  rotatePage: (pageId: string) => void
  setPageFilter: (pageId: string, filter: ScanFilterId) => void
  resetDraft: () => void
}

const initialScanDraftState = {
  draftId: "draft",
  pages: [] as ScanDraftPage[],
}

type ScanDraftStore = ReturnType<typeof createScanDraftStore>

const ScanDraftStoreContext = createContext<ScanDraftStore | null>(null)

export function ScanProvider({ children }: { children: ReactNode }) {
  const [store] = useState(createScanDraftStore)

  return (
    <ScanDraftStoreContext.Provider value={store}>
      {children}
    </ScanDraftStoreContext.Provider>
  )
}

export function useScanDraftStore<T>(
  selector: (state: Omit<ScanDraftState, "actions">) => T
) {
  const store = useContext(ScanDraftStoreContext)

  if (!store) {
    throw new Error("useScanDraftStore must be used within ScanProvider.")
  }

  return useStore(store, selector)
}

export function useScanDraftActions() {
  const store = useContext(ScanDraftStoreContext)

  if (!store) {
    throw new Error("useScanDraftActions must be used within ScanProvider.")
  }

  return useStore(store, (state) => state.actions)
}

function createScanDraftStore() {
  return createStore<ScanDraftState>()((set) => ({
    ...initialScanDraftState,
    actions: {
      upsertPage: (page) =>
        set((state) => {
          const pageExists = state.pages.some(
            (draftPage) => draftPage.id === page.id
          )

          return {
            pages: pageExists
              ? state.pages.map((draftPage) =>
                  draftPage.id === page.id ? page : draftPage
                )
              : [...state.pages, page],
          }
        }),
      removePage: (pageId) =>
        set((state) => ({
          pages: state.pages.filter((page) => page.id !== pageId),
        })),
      replacePageImage: (pageId, imageUrl) =>
        set((state) => ({
          pages: state.pages.map((page) =>
            page.id === pageId ? { ...page, imageUrl } : page
          ),
        })),
      rotatePage: (pageId) =>
        set((state) =>
          updatePageById(state, pageId, (page) => ({
            ...page,
            rotation: minBy(scanPageRotationOption, (n) =>
              Math.abs(n - ((page.rotation + 90) % 360))
            ) as ScanPageRotation,
          }))
        ),
      setPageFilter: (pageId, filter) =>
        set((state) =>
          updatePageById(state, pageId, (page) => ({
            ...page,
            filter,
          }))
        ),
      resetDraft: () => set(initialScanDraftState),
    },
  }))
}

function updatePageById(
  state: ScanDraftState,
  pageId: string,
  updatePage: (page: ScanDraftPage) => ScanDraftPage
) {
  return {
    pages: state.pages.map((page) =>
      page.id === pageId ? updatePage(page) : page
    ),
  }
}
