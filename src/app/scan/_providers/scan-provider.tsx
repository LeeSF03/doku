"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";

export type ScanFilterId = "original" | "bw" | "grayscale" | "color";

export type ScanDraftPage = {
  id: string;
  imageUrl: string;
  rotation: number;
  filter: ScanFilterId;
};

type ScanDraftState = {
  draftId: string;
  auto: boolean;
  pages: ScanDraftPage[];
  currentPageId: string | null;
  actions: ScanDraftActions;
};

type ScanDraftActions = {
  toggleAuto: () => void;
  appendPage: (page: ScanDraftPage) => void;
  upsertPage: (page: ScanDraftPage) => void;
  replacePageImage: (pageId: string, imageUrl: string) => void;
  rotateCurrentPage: () => void;
  setCurrentPageFilter: (filter: ScanFilterId) => void;
  setCurrentPageId: (pageId: string | null) => void;
  resetDraft: () => void;
};

const initialScanDraftState = {
  draftId: "draft",
  auto: false,
  pages: [] as ScanDraftPage[],
  currentPageId: null,
};

type ScanDraftStore = ReturnType<typeof createScanDraftStore>;

const ScanDraftStoreContext = createContext<ScanDraftStore | null>(null);

export function ScanProvider({ children }: { children: ReactNode }) {
  const [store] = useState(createScanDraftStore);

  return (
    <ScanDraftStoreContext.Provider value={store}>
      {children}
    </ScanDraftStoreContext.Provider>
  );
}

export function useScanDraftStore<T>(
  selector: (state: Omit<ScanDraftState, "actions">) => T
) {
  const store = useContext(ScanDraftStoreContext);

  if (!store) {
    throw new Error("useScanDraftStore must be used within ScanProvider.");
  }

  return useStore(store, selector);
}

export function useScanDraftActions() {
  const store = useContext(ScanDraftStoreContext);

  if (!store) {
    throw new Error("useScanDraftActions must be used within ScanProvider.");
  }

  return useStore(store, (state) => state.actions);
}

function createScanDraftStore() {
  return createStore<ScanDraftState>()((set) => ({
    ...initialScanDraftState,
    actions: {
      toggleAuto: () => set((state) => ({ auto: !state.auto })),
      appendPage: (page) =>
        set((state) => ({
          pages: [...state.pages, page],
          currentPageId: page.id,
        })),
      upsertPage: (page) =>
        set((state) => {
          const pageExists = state.pages.some(
            (draftPage) => draftPage.id === page.id
          );

          return {
            pages: pageExists
              ? state.pages.map((draftPage) =>
                  draftPage.id === page.id ? page : draftPage
                )
              : [...state.pages, page],
            currentPageId: page.id,
          };
        }),
      replacePageImage: (pageId, imageUrl) =>
        set((state) => ({
          pages: state.pages.map((page) =>
            page.id === pageId ? { ...page, imageUrl } : page
          ),
        })),
      rotateCurrentPage: () =>
        set((state) => updateCurrentPage(state, rotatePage)),
      setCurrentPageFilter: (filter) =>
        set((state) =>
          updateCurrentPage(state, (page) => ({
            ...page,
            filter,
          }))
        ),
      setCurrentPageId: (currentPageId) => set({ currentPageId }),
      resetDraft: () => set(initialScanDraftState),
    },
  }));
}

function rotatePage(page: ScanDraftPage): ScanDraftPage {
  return {
    ...page,
    rotation: (page.rotation + 90) % 360,
  };
}

function updateCurrentPage(
  state: ScanDraftState,
  updatePage: (page: ScanDraftPage) => ScanDraftPage
) {
  const currentPageId = state.currentPageId ?? state.pages.at(-1)?.id;

  if (!currentPageId) return state;

  return {
    pages: state.pages.map((page) =>
      page.id === currentPageId ? updatePage(page) : page
    ),
  };
}
