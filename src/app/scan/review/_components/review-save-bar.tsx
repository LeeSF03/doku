import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sanitizeFileName } from "@/lib/file";
import { useScanDraftStore } from "../../_providers/scan-provider";
import { createDraftPdf, downloadPdf } from "../_lib/create-draft-pdf";

export function ReviewSaveBar() {
  const router = useRouter();
  const pages = useScanDraftStore((state) => state.pages);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (saving) return;

    setSaving(true);

    try {
      const documentName = name.trim() || "Untitled document";
      const pdfBlob = await createDraftPdf(pages);

      downloadPdf(
        pdfBlob,
        `${sanitizeFileName(documentName, "Untitled document")}.pdf`,
      );
      toast.success("Document saved", {
        description: documentName,
      });
      router.push("/");
    } catch (error) {
      toast.error("Could not save document", {
        description:
          error instanceof Error ? error.message : "Try again in a moment.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 border-t bg-background/95 px-5 pb-[max(env(safe-area-inset-bottom),1rem)] pt-3 backdrop-blur">
      <div className="pointer-events-auto space-y-3">
        <Input
          id="doc-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Untitled document"
          className="h-9 rounded-none border-0 border-b border-border bg-transparent px-1 text-sm shadow-none focus-visible:border-foreground focus-visible:ring-0"
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
  );
}
