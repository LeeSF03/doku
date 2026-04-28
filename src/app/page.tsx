import Link from "next/link"

import { Camera, FileText, Search, Settings2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const documents = [
  { id: "1", title: "Lease Agreement", date: "Today", pages: 8 },
  { id: "2", title: "Receipt — Cafe Lumiere", date: "Yesterday", pages: 1 },
  { id: "3", title: "Passport Scan", date: "Apr 22", pages: 2 },
  { id: "4", title: "Tax Return 2025", date: "Apr 14", pages: 12 },
  { id: "5", title: "Whiteboard Notes", date: "Apr 10", pages: 3 },
  { id: "6", title: "ID Card", date: "Mar 30", pages: 1 },
]

export default function Home() {
  return (
    <div className="bg-background flex min-h-dvh flex-col">
      <header className="bg-background/80 sticky top-0 z-10 flex items-center justify-between border-b px-5 pt-[max(env(safe-area-inset-top),1rem)] pb-3 backdrop-blur">
        <div className="flex flex-col">
          <h1 className="text-xl font-semibold tracking-tight">Doku</h1>
          <p className="text-muted-foreground text-xs">
            {documents.length} documents
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

      <main className="flex-1 px-5 pt-4 pb-32">
        <div className="grid grid-cols-2 gap-3">
          {documents.map((doc) => (
            <article
              key={doc.id}
              className="group bg-card text-card-foreground active:bg-accent/40 flex flex-col overflow-hidden rounded-xl border transition-colors"
            >
              <div className="bg-muted relative flex aspect-[3/4] items-center justify-center">
                <FileText className="text-muted-foreground/50 size-10" />
                <Badge
                  variant="secondary"
                  className="absolute top-2 right-2 h-5 rounded-md px-1.5 text-[10px] font-medium"
                >
                  {doc.pages}p
                </Badge>
              </div>
              <div className="flex flex-col gap-0.5 p-3">
                <h3 className="truncate text-sm leading-tight font-medium">
                  {doc.title}
                </h3>
                <p className="text-muted-foreground text-xs">{doc.date}</p>
              </div>
            </article>
          ))}
        </div>
      </main>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 flex justify-center px-5 pb-[max(env(safe-area-inset-bottom),1.25rem)]">
        <Button
          asChild
          size="lg"
          className="pointer-events-auto h-14 w-full max-w-md gap-2 rounded-full text-base shadow-lg"
        >
          <Link href="/scan">
            <Camera className="size-5" />
            Scan Document
          </Link>
        </Button>
      </div>
    </div>
  )
}
