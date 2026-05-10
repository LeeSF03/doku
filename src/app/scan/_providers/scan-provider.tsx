"use client"

import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react"

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
  draftId: string | null
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
  draftId: null,
  pages: [],
} satisfies Omit<ScanDraftState, "actions">

type ScanDraftStore = ReturnType<typeof createScanDraftStore>

const ScanDraftStoreContext = createContext<ScanDraftStore | null>(null)

export function ScanProvider({ children }: { children: ReactNode }) {
  const [store] = useState(createScanDraftStore)

  useEffect(() => {
    return () => {
      revokePageImageUrls(store.getState().pages)
    }
  }, [store])

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
          const previousPage = state.pages.find(
            (draftPage) => draftPage.id === page.id
          )
          const nextPages = pageExists
            ? state.pages.map((draftPage) =>
                draftPage.id === page.id ? page : draftPage
              )
            : [...state.pages, page]

          if (previousPage && previousPage.imageUrl !== page.imageUrl) {
            URL.revokeObjectURL(previousPage.imageUrl)
          }

          return {
            pages: nextPages,
          }
        }),
      removePage: (pageId) =>
        set((state) => {
          const removedPage = state.pages.find((page) => page.id === pageId)

          if (removedPage) URL.revokeObjectURL(removedPage.imageUrl)

          return {
            pages: state.pages.filter((page) => page.id !== pageId),
          }
        }),
      replacePageImage: (pageId, imageUrl) =>
        set((state) => {
          const nextPages = state.pages.map((page) => {
            if (page.id !== pageId) return page

            URL.revokeObjectURL(page.imageUrl)

            return {
              ...page,
              imageUrl,
            }
          })

          return {
            pages: nextPages,
          }
        }),
      rotatePage: (pageId) =>
        set((state) => {
          return updatePageById(state, pageId, (page) => ({
            ...page,
            rotation: minBy(scanPageRotationOption, (n) =>
              Math.abs(n - ((page.rotation + 90) % 360))
            ) as ScanPageRotation,
          }))
        }),
      setPageFilter: (pageId, filter) =>
        set((state) => {
          return updatePageById(state, pageId, (page) => ({
            ...page,
            filter,
          }))
        }),
      resetDraft: () =>
        set((state) => {
          revokePageImageUrls(state.pages)

          return {
            ...initialScanDraftState,
          }
        }),
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

function revokePageImageUrls(pages: ScanDraftPage[]) {
  pages.forEach((page) => URL.revokeObjectURL(page.imageUrl))
}
