import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReviewAddPageButton() {
  return (
    <Button asChild variant="outline" className="mt-4 h-12 w-full gap-2">
      <Link href="/scan">
        <Plus className="size-4" />
        Add another page
      </Link>
    </Button>
  );
}
