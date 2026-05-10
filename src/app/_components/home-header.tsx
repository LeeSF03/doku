"use client"

import { Search, Settings2 } from "lucide-react"

import { Button } from "@/components/ui/button"

export function HomeHeader({ draftCount }: { draftCount: number }) {
  return (
    <header className="bg-background/80 sticky top-0 z-10 flex items-center justify-between border-b px-5 pt-[max(env(safe-area-inset-top),1rem)] pb-3 backdrop-blur">
      <div className="flex flex-col">
        <h1 className="text-xl font-semibold tracking-tight">Doku</h1>
        <p className="text-muted-foreground text-xs">
          {draftCount} {draftCount === 1 ? "draft" : "drafts"}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" aria-label="Search">
          <Search />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Settings">
          <Settings2 />
        </Button>
      </div>
    </header>
  )
}
