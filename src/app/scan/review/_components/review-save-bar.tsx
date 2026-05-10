import { useState } from "react"

import { useRouter } from "next/navigation"

import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { sanitizeFileName } from "@/lib/file"

import { useScanDraftStore } from "../../_providers/scan-provider"
import { createDraftPdf, downloadPdf } from "../_lib/create-draft-pdf"

export function ReviewSaveBar() {
  const router = useRouter()
  const pages = useScanDraftStore((state) => state.pages)
  const [name, setName] = useState("")
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (saving) return

    setSaving(true)

    try {
      const documentName = name.trim() || "Untitled document"
      const fallbackFileName = `doku_${Date.now()}`
      const pdfBlob = await createDraftPdf(pages)

      downloadPdf(
        pdfBlob,
        `${sanitizeFileName(name, fallbackFileName)}.pdf`
      )
      toast.success("Document saved", {
        description: documentName,
      })
      router.push("/")
    } catch (error) {
      toast.error("Could not save document", {
        description:
          error instanceof Error ? error.message : "Try again in a moment.",
      })
    } finally {
      setSaving(false)
    }
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
          disabled={pages.length === 0 || saving}
          size="lg"
          className="h-14 w-full rounded-full text-base"
        >
          {saving ? "Saving..." : "Save Document"}
        </Button>
      </div>
    </div>
  )
}
