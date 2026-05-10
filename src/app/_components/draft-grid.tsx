"use client"

import Image from "next/image"
import Link from "next/link"

import { EllipsisVertical, FileText } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { listScanDrafts } from "../scan/_lib/scan-drafts-db"

type DraftCard = Awaited<ReturnType<typeof listScanDrafts>>[number] & {
  thumbnailUrl: string | null
}

export function DraftGrid({
  drafts,
  onDeleteDraft,
}: {
  drafts: DraftCard[]
  onDeleteDraft: (draft: DraftCard) => Promise<void>
}) {
  if (drafts.length === 0) return <EmptyDrafts />

  return (
    <div className="grid grid-cols-2 gap-3">
      {drafts.map((draft) => (
        <DraftCard key={draft.id} draft={draft} onDeleteDraft={onDeleteDraft} />
      ))}
    </div>
  )
}

function DraftCard({
  draft,
  onDeleteDraft,
}: {
  draft: DraftCard
  onDeleteDraft: (draft: DraftCard) => Promise<void>
}) {
  return (
    <div className="group bg-card text-card-foreground active:bg-accent/40 relative flex flex-col overflow-hidden rounded-xl border transition-colors">
      <Link href={`/scan/review?draft-id=${encodeURIComponent(draft.id)}`}>
        <div className="bg-muted relative flex aspect-[3/4] items-center justify-center overflow-hidden">
          {draft.thumbnailUrl ? (
            <Image
              src={draft.thumbnailUrl}
              alt=""
              fill
              unoptimized
              sizes="50vw"
              className="object-cover"
            />
          ) : (
            <FileText className="text-muted-foreground/50 size-10" />
          )}
          <Badge
            variant="secondary"
            className="absolute top-2 left-2 h-5 rounded-md px-1.5 text-[10px] font-medium"
          >
            {draft.pageCount}p
          </Badge>
        </div>
        <div className="flex flex-col gap-0.5 p-3">
          <h3 className="truncate pr-8 text-sm leading-tight font-medium">
            {draft.name.trim() || "Untitled document"}
          </h3>
          <p className="text-muted-foreground text-xs">
            {formatDraftDate(draft.updatedAt)}
          </p>
        </div>
      </Link>
      <DeleteDraftDialog draft={draft} onDeleteDraft={onDeleteDraft} />
    </div>
  )
}

function DeleteDraftDialog({
  draft,
  onDeleteDraft,
}: {
  draft: DraftCard
  onDeleteDraft: (draft: DraftCard) => Promise<void>
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Draft actions"
          className="bg-background/80 hover:bg-background absolute top-2 right-2 rounded-full shadow-sm"
        >
          <EllipsisVertical />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete draft?</DialogTitle>
          <DialogDescription>
            This will permanently delete{" "}
            {draft.name.trim() || "Untitled document"}.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="destructive" onClick={() => onDeleteDraft(draft)}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function EmptyDrafts() {
  return (
    <div className="text-muted-foreground flex min-h-64 flex-col items-center justify-center gap-2 text-center">
      <FileText className="size-10 opacity-50" />
      <p className="text-sm">No drafts yet</p>
    </div>
  )
}

function formatDraftDate(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(timestamp)
}
