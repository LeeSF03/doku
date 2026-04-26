import { cn } from "@/lib/utils";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import {
  useScanDraftActions,
  useScanDraftStore,
} from "../../_providers/scan-provider";

export function ReviewPageCarousel() {
  const pages = useScanDraftStore((state) => state.pages);
  const currentPageId = useScanDraftStore((state) => state.currentPageId);
  const { setCurrentPageId } = useScanDraftActions();

  if (pages.length === 0) {
    return (
      <div className="mt-5 flex h-20 items-center justify-center rounded-xl border border-dashed bg-muted/40 text-sm text-muted-foreground">
        No pages captured yet
      </div>
    );
  }

  const selectedPageId = currentPageId ?? pages.at(-1)?.id;

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between px-1">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Pages
        </p>
        <p className="text-xs text-muted-foreground">
          {pages.length} {pages.length === 1 ? "page" : "pages"}
        </p>
      </div>

      <Carousel className="mt-2" opts={{ align: "start", dragFree: true }}>
        <CarouselContent className="-ml-3">
          {pages.map((page, index) => {
            const selected = page.id === selectedPageId;

            return (
              <CarouselItem key={page.id} className="basis-auto pl-3">
                <button
                  type="button"
                  onClick={() => setCurrentPageId(page.id)}
                  aria-current={selected ? "page" : undefined}
                  className={cn(
                    "relative h-20 w-16 overflow-hidden rounded-lg border bg-muted transition-colors",
                    selected
                      ? "border-foreground ring-2 ring-foreground/20"
                      : "border-border hover:border-foreground/40"
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={page.imageUrl}
                    alt={`Page ${index + 1}`}
                    className={cn(
                      "h-full w-full object-cover",
                      page.filter === "bw" && "contrast-150 grayscale",
                      page.filter === "grayscale" && "grayscale",
                      page.filter === "color" && "saturate-150"
                    )}
                    style={{ transform: `rotate(${page.rotation}deg)` }}
                  />
                  <span className="absolute bottom-1 left-1 rounded bg-background/85 px-1.5 py-0.5 text-[10px] font-medium text-foreground shadow-sm">
                    {index + 1}
                  </span>
                </button>
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>
    </div>
  );
}
