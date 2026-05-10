import { Crop, RotateCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

import {
  ACTIVE_SCAN_DRAFT_ID,
  updateScanDraftPage,
} from "../../_lib/scan-drafts-db"
import {
  type ScanDraftPage,
  type ScanFilterId,
  type ScanPageRotation,
  useScanDraftActions,
} from "../../_providers/scan-provider"

const filters = [
  { id: "original", label: "Original" },
  { id: "bw", label: "B&W" },
  { id: "grayscale", label: "Grayscale" },
  { id: "color", label: "Color" },
] as const
const scanPageRotationOption = [0, 90, 180, 270] as const

export function ReviewToolbar({
  currentPage,
}: {
  currentPage: ScanDraftPage | null
}) {
  const { rotatePage, setPageFilter } = useScanDraftActions()
  const activeFilter = currentPage?.filter ?? "original"

  const handleFilterChange = (filter: ScanFilterId) => {
    if (!currentPage) return

    setPageFilter(currentPage.id, filter)
    updateScanDraftPage(ACTIVE_SCAN_DRAFT_ID, {
      id: currentPage.id,
      filter,
    })
  }

  const handleRotatePage = () => {
    if (!currentPage) return

    const rotation = scanPageRotationOption[
      (scanPageRotationOption.indexOf(currentPage.rotation) + 1) %
        scanPageRotationOption.length
    ] as ScanPageRotation

    rotatePage(currentPage.id)
    updateScanDraftPage(ACTIVE_SCAN_DRAFT_ID, {
      id: currentPage.id,
      rotation,
    })
  }

  return (
    <div className="mt-5 flex flex-1 items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-0.5 [&>button]:gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRotatePage}
          disabled={!currentPage}
        >
          <RotateCw className="size-4" />
          Rotate 90°
        </Button>
        <Separator orientation="vertical" className="h-5!" />
        <Button
          variant="ghost"
          size="sm"
          disabled
          className="disabled:opacity-50"
        >
          <Crop className="size-4" />
          Crop
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
  )
}
