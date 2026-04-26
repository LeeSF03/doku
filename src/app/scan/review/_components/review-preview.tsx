import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDraftCurrentPage } from "../_hooks/use-draft-current-page";

export function ReviewPreview() {
  const page = useDraftCurrentPage();

  return (
    <div
      className={cn(
        "mx-auto flex aspect-[3/4] w-full max-w-sm items-center justify-center overflow-hidden rounded-xl border bg-muted transition-all",
        page?.filter === "bw" && "bg-zinc-100 contrast-150",
        page?.filter === "grayscale" && "grayscale",
        page?.filter === "color" && "saturate-150"
      )}
    >
      {page ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={page.imageUrl}
          alt="Captured scan"
          className="h-full w-full object-cover transition-transform"
          style={{ transform: `rotate(${page.rotation}deg)` }}
        />
      ) : (
        <FileText className="size-16 text-muted-foreground/40" />
      )}
    </div>
  );
}
