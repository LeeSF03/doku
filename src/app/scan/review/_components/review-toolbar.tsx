import { useRouter } from "next/navigation";
import { Crop, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type ScanFilterId,
  type ScanDraftPage,
  useScanDraftActions,
} from "../../_providers/scan-provider";

const filters = [
  { id: "original", label: "Original" },
  { id: "bw", label: "B&W" },
  { id: "grayscale", label: "Grayscale" },
  { id: "color", label: "Color" },
] as const;

export function ReviewToolbar({
  currentPage,
}: {
  currentPage: ScanDraftPage | null;
}) {
  const router = useRouter();
  const { rotatePage, setPageFilter } = useScanDraftActions();
  const activeFilter = currentPage?.filter ?? "original";

  const handleRetake = () => {
    if (!currentPage) return;

    router.push(`/scan?replace-page-id=${encodeURIComponent(currentPage.id)}`);
  };

  const handleFilterChange = (filter: ScanFilterId) => {
    if (!currentPage) return;

    setPageFilter(currentPage.id, filter);
  };

  return (
    <div className="mt-5 flex flex-1 items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-0.5 [&>button]:gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => currentPage && rotatePage(currentPage.id)}
          disabled={!currentPage}
        >
          <RotateCw className="size-4" />
          Rotate
        </Button>
        <Separator orientation="vertical" className="h-5!" />
        <Button variant="ghost" size="sm">
          <Crop className="size-4" />
          Crop
        </Button>
        <Separator orientation="vertical" className="h-5!" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleRetake}
          disabled={!currentPage}
          className="gap-1.5"
        >
          Retake
        </Button>
      </div>

      <Select
        value={activeFilter}
        onValueChange={(filter) => handleFilterChange(filter as ScanFilterId)}
        disabled={!currentPage}
      >
        <SelectTrigger className="w-28 shrink-0">
          <SelectValue aria-label="Filter" />
        </SelectTrigger>
        <SelectContent align="end">
          {filters.map((filter) => (
            <SelectItem key={filter.id} value={filter.id}>
              {filter.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
