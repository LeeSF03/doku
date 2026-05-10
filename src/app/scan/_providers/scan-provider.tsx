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

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import {
  ACTIVE_SCAN_DRAFT_ID,
  clearActiveScanDraft,
  loadActiveScanDraft,
} from "../_lib/scan-drafts-db"

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
  restoreActiveDraft: (pages: ScanDraftPage[]) => void
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
  const [pendingDraft, setPendingDraft] =
    useState<Awaited<ReturnType<typeof loadActiveScanDraft>>>(null)
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false)

  useEffect(() => {
    let cancelled = false

    loadActiveScanDraft().then((draft) => {
      if (cancelled) return

      if (draft?.pages.length) {
        setPendingDraft(draft)
        setRestoreDialogOpen(true)
        return
      }

      store.getState().actions.restoreActiveDraft([])
    })

    return () => {
      cancelled = true
      revokePageImageUrls(store.getState().pages)
    }
  }, [store])

  function handleRestoreDraft() {
    if (!pendingDraft) return

    store.getState().actions.restoreActiveDraft(
      pendingDraft.pages.map((page) => ({
        id: page.id,
        imageUrl: URL.createObjectURL(page.imageBlob),
        rotation: page.rotation,
        filter: page.filter,
      }))
    )
    setPendingDraft(null)
    setRestoreDialogOpen(false)
  }

  async function handleDiscardDraft() {
    await clearActiveScanDraft()
    store.getState().actions.restoreActiveDraft([])
    setPendingDraft(null)
    setRestoreDialogOpen(false)
  }

  const pendingPageCount = pendingDraft?.pages.length ?? 0

  return (
    <ScanDraftStoreContext.Provider value={store}>
      {children}
      <Dialog open={restoreDialogOpen}>
        <DialogContent
          showCloseButton={false}
          onEscapeKeyDown={(event) => event.preventDefault()}
          onInteractOutside={() => setRestoreDialogOpen(false)}
        >
          <DialogHeader>
            <DialogTitle>Continue previous scan?</DialogTitle>
            <DialogDescription>
              You have an unfinished scan with {pendingPageCount}{" "}
              {pendingPageCount === 1 ? "page" : "pages"}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleDiscardDraft}>
              Discard
            </Button>
            <Button onClick={handleRestoreDraft}>Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
      restoreActiveDraft: (pages) =>
        set((state) => {
          revokePageImageUrls(state.pages)

          return {
            draftId: ACTIVE_SCAN_DRAFT_ID,
            pages,
          }
        }),
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
            draftId: ACTIVE_SCAN_DRAFT_ID,
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
