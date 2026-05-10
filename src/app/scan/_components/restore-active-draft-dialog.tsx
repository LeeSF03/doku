"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function RestoreActiveDraftDialog({
  open,
  pageCount,
  onDiscard,
  onRestore,
  onInteractOutside,
}: {
  open: boolean
  pageCount: number
  onDiscard: () => void
  onRestore: () => void
  onInteractOutside: () => void
}) {
  return (
    <Dialog open={open}>
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={onInteractOutside}
      >
        <DialogHeader>
          <DialogTitle>Continue previous scan?</DialogTitle>
          <DialogDescription>
            You have an unfinished scan with {pageCount}{" "}
            {pageCount === 1 ? "page" : "pages"}.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onDiscard}>
            Discard
          </Button>
          <Button onClick={onRestore}>Continue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
