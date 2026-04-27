"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useScanDraftActions } from "../../_providers/scan-provider";

export function ReviewHeader() {
  const router = useRouter();
  const { resetDraft } = useScanDraftActions();

  const handleDiscardDraft = () => {
    resetDraft();
    router.replace("/scan");
  };

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/80 px-3 pt-[max(env(safe-area-inset-top),0.75rem)] pb-2 backdrop-blur">
      <Button asChild variant="ghost" size="icon" aria-label="Back to scanner">
        <Link href="/scan">
          <ArrowLeft />
        </Link>
      </Button>
      <h1 className="text-sm font-medium">Review</h1>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Discard"
        onClick={handleDiscardDraft}
        className="text-destructive hover:text-destructive"
      >
        <Trash2 />
      </Button>
    </header>
  );
}
