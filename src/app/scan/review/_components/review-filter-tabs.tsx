import { cn } from "@/lib/utils";
import { useScanDraftActions } from "../../_providers/scan-provider";
import { useDraftCurrentPage } from "../_hooks/use-draft-current-page";

const filters = [
  { id: "original", label: "Original" },
  { id: "bw", label: "B&W" },
  { id: "grayscale", label: "Grayscale" },
  { id: "color", label: "Color" },
] as const;

export function ReviewFilterTabs() {
  const page = useDraftCurrentPage();
  const { setCurrentPageFilter } = useScanDraftActions();
  const activeFilter = page?.filter ?? "original";

  return (
    <div className="mt-6">
      <p className="px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Filter
      </p>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {filters.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setCurrentPageFilter(option.id)}
            disabled={!page}
            className={cn(
              "h-9 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
              activeFilter === option.id
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-card text-foreground hover:bg-accent"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
