"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";

export type ScanMode = "document" | "id" | "photo";

export type ScanFilterId = "original" | "bw" | "grayscale" | "color";

export type ScanDraftPage = {
  id: string;
  imageUrl: string;
  rotation: number;
  filter: ScanFilterId;
};

type ScanDraftState = {
  draftId: string;
  mode: ScanMode;
  auto: boolean;
  pages: ScanDraftPage[];
  currentPageId: string | null;
  actions: ScanDraftActions;
};

type ScanDraftActions = {
  setMode: (mode: ScanMode) => void;
  toggleAuto: () => void;
  appendPage: (page: ScanDraftPage) => void;
  setCurrentPageId: (pageId: string | null) => void;
  resetDraft: () => void;
};

const initialScanDraftState = {
  draftId: "draft",
  mode: "document" as ScanMode,
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
      setMode: (mode) => set({ mode }),
      toggleAuto: () => set((state) => ({ auto: !state.auto })),
      appendPage: (page) =>
        set((state) => ({
          pages: [...state.pages, page],
          currentPageId: page.id,
        })),
      setCurrentPageId: (currentPageId) => set({ currentPageId }),
      resetDraft: () => set(initialScanDraftState),
    },
  }));
}
