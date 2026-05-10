import { useState, useTransition } from "react"

import { useRouter } from "next/navigation"

import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

import { sanitizeFileName } from "@/lib/file"

import { saveScanDraft } from "../../_lib/scan-drafts-db"
import {
  useScanDraftActions,
  useScanDraftStore,
} from "../../_providers/scan-provider"
import { createDraftPdf, downloadPdf } from "../_lib/create-draft-pdf"

export function ReviewSaveBar() {
  const router = useRouter()
  const pages = useScanDraftStore((state) => state.pages)
  const { resetDraft } = useScanDraftActions()
  const [name, setName] = useState("")
  const [keepDraftDialogOpen, setKeepDraftDialogOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleSave = () => {
    if (isPending) return

    startTransition(async () => {
      try {
        const documentName = name.trim() || "Untitled document"
        const fallbackFileName = `doku_${Date.now()}`
        const pdfBlob = await createDraftPdf(pages)

        downloadPdf(pdfBlob, `${sanitizeFileName(name, fallbackFileName)}.pdf`)
        toast.success("Document saved", {
          description: documentName,
        })
        setKeepDraftDialogOpen(true)
      } catch (error) {
        toast.error("Could not save document", {
          description:
            error instanceof Error ? error.message : "Try again in a moment.",
        })
      }
    })
  }

  function handleKeepDraft() {
    startTransition(async () => {
      await saveScanDraft({
        id: crypto.randomUUID(),
        name: name.trim() || "Untitled document",
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
      resetDraft()
      router.push("/")
    })
  }

  function handleDiscardDraft() {
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
          onClick={handleSave}
          disabled={pages.length === 0 || isPending}
          size="lg"
          className="h-14 w-full rounded-full text-base"
        >
          {isPending ? "Saving..." : "Save Document"}
        </Button>
      </div>

      <Dialog open={keepDraftDialogOpen}>
        <DialogContent
          showCloseButton={false}
          onEscapeKeyDown={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Keep this draft?</DialogTitle>
            <DialogDescription>
              Your PDF has been exported. Keep the draft if you want to edit or
              export it again later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleDiscardDraft}>
              Discard draft
            </Button>
            <Button onClick={handleKeepDraft}>Keep draft</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
