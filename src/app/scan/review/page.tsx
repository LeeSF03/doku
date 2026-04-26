"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  Crop,
  FileText,
  Plus,
  RotateCw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const filters = [
  { id: "original", label: "Original" },
  { id: "bw", label: "B&W" },
  { id: "grayscale", label: "Grayscale" },
  { id: "color", label: "Color" },
] as const;

type FilterId = (typeof filters)[number]["id"];

export default function ReviewPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterId>("original");
  const [name, setName] = useState("Scanned Document");

  const handleSave = () => {
    toast.success("Document saved", {
      description: name || "Untitled document",
    });
    router.push("/");
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/80 px-3 pt-[max(env(safe-area-inset-top),0.75rem)] pb-2 backdrop-blur">
        <Button asChild variant="ghost" size="icon" aria-label="Back to scanner">
          <Link href="/scan">
            <ArrowLeft />
          </Link>
        </Button>
        <h1 className="text-sm font-medium">Review</h1>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Discard"
          className="text-destructive hover:text-destructive"
        >
          <Trash2 />
        </Button>
      </header>

      <main className="flex-1 px-5 pb-32 pt-4">
        <div
          className={cn(
            "mx-auto flex aspect-[3/4] w-full max-w-sm items-center justify-center rounded-xl border bg-muted transition-all",
            filter === "bw" && "bg-zinc-100 contrast-150",
            filter === "grayscale" && "grayscale",
            filter === "color" && "saturate-150"
          )}
        >
          <FileText className="size-16 text-muted-foreground/40" />
        </div>

        <div className="mt-5 flex items-center justify-center gap-1">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <RotateCw className="size-4" />
            Rotate
          </Button>
          <Separator orientation="vertical" className="!h-5" />
          <Button variant="ghost" size="sm" className="gap-1.5">
            <Crop className="size-4" />
            Crop
          </Button>
          <Separator orientation="vertical" className="!h-5" />
          <Button asChild variant="ghost" size="sm" className="gap-1.5">
            <Link href="/scan">Retake</Link>
          </Button>
        </div>

        <div className="mt-6">
          <p className="px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Filter
          </p>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {filters.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={cn(
                  "h-9 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors",
                  filter === f.id
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-card text-foreground hover:bg-accent"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <label
            htmlFor="doc-name"
            className="px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground"
          >
            Name
          </label>
          <Input
            id="doc-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Untitled document"
            className="h-12 text-base"
          />
        </div>

        <Button asChild variant="outline" className="mt-4 h-12 w-full gap-2">
          <Link href="/scan">
            <Plus className="size-4" />
            Add another page
          </Link>
        </Button>
      </main>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 border-t bg-background/95 px-5 pb-[max(env(safe-area-inset-bottom),1rem)] pt-3 backdrop-blur">
        <Button
          onClick={handleSave}
          size="lg"
          className="pointer-events-auto h-14 w-full rounded-full text-base"
        >
          Save Document
        </Button>
      </div>
    </div>
  );
}
