import Image from "next/image";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useQueryState } from "nuqs";
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
  const router = useRouter();
  const pages = useScanDraftStore((state) => state.pages);
  const [draftPageId, setDraftPageId] = useQueryState("draft-page-id");
  const { removePage } = useScanDraftActions();

  if (pages.length === 0) {
    return (
      <div className="mt-5 flex h-20 items-center justify-center rounded-xl border border-dashed bg-muted/40 text-sm text-muted-foreground">
        No pages captured yet
      </div>
    );
  }

  const selectedPageId = draftPageId ?? pages.at(-1)?.id;

  const handleRemovePage = async (pageId: string) => {
    const pageIndex = pages.findIndex((page) => page.id === pageId);
    const nextSelectedPage = pages[pageIndex + 1] ?? pages[pageIndex - 1];

    removePage(pageId);

    if (nextSelectedPage) {
      await setDraftPageId(nextSelectedPage.id);
    } else {
      await setDraftPageId(null);
      router.replace("/scan");
    }
  };

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
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setDraftPageId(page.id)}
                    aria-current={selected ? "page" : undefined}
                    className={cn(
                      "relative h-20 w-16 overflow-hidden rounded-lg border bg-muted transition-colors",
                      selected
                        ? "border-foreground ring-2 ring-foreground/20"
                        : "border-border hover:border-foreground/40",
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
                        "object-cover data-[filter=none]:bg-transparent data-[filter=bw]:bg-zinc-100 data-[filter=bw]:contrast-150 data-[filter=grayscale]:grayscale data-[filter=color]:saturate-150",
                      )}
                      style={{ transform: `rotate(${page.rotation}deg)` }}
                    />
                    <span className="absolute bottom-1 left-1 rounded bg-background/85 px-1.5 py-0.5 text-[10px] font-medium text-foreground shadow-sm">
                      {index + 1}
                    </span>
                  </button>

                  {selected && (
                    <button
                      type="button"
                      onClick={() => handleRemovePage(page.id)}
                      aria-label={`Remove page ${index + 1}`}
                      className="absolute -right-2 -top-2 grid size-7 place-items-center rounded-full border border-destructive/20 bg-background text-destructive shadow-sm transition-colors hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>
    </div>
  );
}
