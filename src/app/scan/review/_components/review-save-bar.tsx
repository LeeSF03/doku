import { useTransition } from "react"

import { useRouter } from "next/navigation"

import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { sanitizeFileName } from "@/lib/file"

import { saveScanDraft } from "../../_lib/scan-drafts-db"
import {
  useScanDraftActions,
  useScanDraftStore,
} from "../../_providers/scan-provider"
import { createDraftPdf, downloadPdf } from "../_lib/create-draft-pdf"

export function ReviewSaveBar({ draftId }: { draftId: string | null }) {
  const router = useRouter()
  const { resetDraft, setName } = useScanDraftActions()
  const pages = useScanDraftStore((state) => state.pages)
  const name = useScanDraftStore((state) => state.name)
  const [isPending, startTransition] = useTransition()
  const hasPages = pages.length > 0
  const hasDraftId = Boolean(draftId)
  const draftActionLabel = draftId ? "Update draft" : "Save draft"

  const handleExportPdf = () => {
    if (isPending) return

    startTransition(async () => {
      try {
        const documentName = name.trim() || "Untitled document"
        const fallbackFileName = `doku_${Date.now()}`
        const pdfBlob = await createDraftPdf(pages)

        downloadPdf(pdfBlob, `${sanitizeFileName(name, fallbackFileName)}.pdf`)
        toast.success("PDF exported", {
          description: documentName,
        })
        resetDraft()
        router.push("/")
      } catch (error) {
        toast.error("Could not export PDF", {
          description:
            error instanceof Error ? error.message : "Try again in a moment.",
        })
      }
    })
  }

  function handleSaveDraft({ copy }: { copy: boolean }) {
    if (isPending) return

    startTransition(async () => {
      try {
        const nextDraftId = copy
          ? crypto.randomUUID()
          : (draftId ?? crypto.randomUUID())
        const documentName = name.trim() || "Untitled document"

        await saveScanDraft({
          id: nextDraftId,
          name: documentName,
          pages: await Promise.all(
            pages.map(async (page, index) => {
              const imageResponse = await fetch(page.imageUrl)

              return {
                id: page.id,
                imageBlob: await imageResponse.blob(),
                order: index,
                rotation: page.rotation,
                filter: page.filter,
              }
            })
          ),
        })
        toast.success(copy ? "Draft saved as new" : "Draft saved", {
          description: documentName,
        })
        resetDraft()
        router.push("/")
      } catch (error) {
        toast.error("Could not save draft", {
          description:
            error instanceof Error ? error.message : "Try again in a moment.",
        })
      }
    })
  }

  function handleDiscardDraft() {
    if (isPending) return

    startTransition(async () => {
      resetDraft()
      router.push("/")
    })
  }

  return (
    <div className="bg-background/95 pointer-events-none fixed inset-x-0 bottom-0 border-t px-5 pt-3 pb-[max(env(safe-area-inset-bottom),1rem)] backdrop-blur">
      <div className="pointer-events-auto space-y-3">
        <Input
          id="doc-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Untitled document"
          className="border-border focus-visible:border-foreground h-9 rounded-none border-0 border-b bg-transparent px-1 text-sm shadow-none focus-visible:ring-0"
        />

        <Button
          onClick={handleExportPdf}
          disabled={!hasPages || isPending}
          size="lg"
          className="h-14 w-full rounded-full text-base"
        >
          {isPending ? "Working..." : "Export PDF"}
        </Button>

        <div className={hasDraftId ? "grid grid-cols-2 gap-2" : ""}>
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleSaveDraft({ copy: false })}
            disabled={!hasPages || isPending}
            className="w-full"
          >
            {draftActionLabel}
          </Button>
          {hasDraftId && (
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSaveDraft({ copy: true })}
              disabled={!hasPages || isPending}
            >
              Save as new
            </Button>
          )}
        </div>

        <Button
          type="button"
          variant="ghost"
          onClick={handleDiscardDraft}
          disabled={isPending}
          className="text-muted-foreground h-9 w-full"
        >
          Discard
        </Button>
      </div>
    </div>
  )
}
