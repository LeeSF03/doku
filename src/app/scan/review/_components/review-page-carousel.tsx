import Image from "next/image"
import { useRouter } from "next/navigation"

import { Trash2 } from "lucide-react"

import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"

import { cn } from "@/lib/utils"

import {
  useScanDraftActions,
  useScanDraftStore,
} from "../../_providers/scan-provider"

type ReviewPageCarouselProps = {
  selectedPageId: string | null
  setSelectedPageId: (pageId: string | null) => Promise<URLSearchParams>
}

export function ReviewPageCarousel({
  selectedPageId,
  setSelectedPageId,
}: ReviewPageCarouselProps) {
  const router = useRouter()
  const pages = useScanDraftStore((state) => state.pages)
  const { removePage } = useScanDraftActions()

  if (pages.length === 0) {
    return (
      <div className="bg-muted/40 text-muted-foreground mt-5 flex h-20 items-center justify-center rounded-xl border border-dashed text-sm">
        No pages captured yet
      </div>
    )
  }

  const activePageId = selectedPageId ?? pages.at(-1)?.id

  const handleRemovePage = async (pageId: string) => {
    const pageIndex = pages.findIndex((page) => page.id === pageId)
    const nextSelectedPage = pages[pageIndex + 1] ?? pages[pageIndex - 1]

    removePage(pageId)

    if (nextSelectedPage) {
      await setSelectedPageId(nextSelectedPage.id)
    } else {
      await setSelectedPageId(null)
      router.replace("/scan")
    }
  }

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between px-1">
        <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
          Pages
        </p>
        <p className="text-muted-foreground text-xs">
          {pages.length} {pages.length === 1 ? "page" : "pages"}
        </p>
      </div>

      <Carousel className="mt-2" opts={{ align: "start", dragFree: true }}>
        <CarouselContent className="-ml-3">
          {pages.map((page, index) => {
            const selected = page.id === activePageId

            return (
              <CarouselItem key={page.id} className="basis-auto pl-3">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setSelectedPageId(page.id)}
                    aria-current={selected ? "page" : undefined}
                    className={cn(
                      "bg-muted relative h-20 w-16 overflow-hidden rounded-lg border transition-colors",
                      selected
                        ? "border-foreground ring-foreground/20 ring-2"
                        : "border-border hover:border-foreground/40"
                    )}
                  >
                    <Image
                      src={page.imageUrl}
                      alt={`Page ${index + 1}`}
                      fill
                      unoptimized
                      sizes="64px"
                      data-filter={page.filter}
                      className={cn(
                        "object-cover data-[filter=bw]:bg-zinc-100 data-[filter=bw]:contrast-150 data-[filter=color]:saturate-150 data-[filter=grayscale]:grayscale data-[filter=none]:bg-transparent"
                      )}
                      style={{ transform: `rotate(${page.rotation}deg)` }}
                    />
                    <span className="bg-background/85 text-foreground absolute bottom-1 left-1 rounded px-1.5 py-0.5 text-[10px] font-medium shadow-sm">
                      {index + 1}
                    </span>
                  </button>

                  {selected && (
                    <button
                      type="button"
                      onClick={() => handleRemovePage(page.id)}
                      aria-label={`Remove page ${index + 1}`}
                      className="border-destructive/20 bg-background text-destructive hover:bg-destructive hover:text-destructive-foreground absolute -top-2 -right-2 grid size-7 place-items-center rounded-full border shadow-sm transition-colors"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              </CarouselItem>
            )
          })}
        </CarouselContent>
      </Carousel>
    </div>
  )
}
