"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Images,
  Sparkles,
  X,
  Zap,
  ZapOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function ScanPage() {
  const [flash, setFlash] = useState(false);
  const [auto, setAuto] = useState(true);
  const [mode, setMode] = useState("document");

  return (
    <div className="dark fixed inset-0 flex flex-col bg-black text-white">
      <div className="flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),1rem)] pb-3">
        <Button
          asChild
          variant="ghost"
          size="icon"
          className="rounded-full text-white hover:bg-white/10 hover:text-white"
        >
          <Link href="/" aria-label="Close scanner">
            <X />
          </Link>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setAuto((a) => !a)}
          className="h-8 gap-1.5 rounded-full bg-white/10 px-3 text-xs font-medium text-white hover:bg-white/20 hover:text-white"
        >
          <Sparkles className="size-3.5" />
          {auto ? "Auto" : "Manual"}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setFlash((f) => !f)}
          aria-label={flash ? "Disable flash" : "Enable flash"}
          className="rounded-full text-white hover:bg-white/10 hover:text-white"
        >
          {flash ? (
            <Zap className="fill-yellow-300 text-yellow-300" />
          ) : (
            <ZapOff />
          )}
        </Button>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black" />

        <div className="absolute inset-x-6 inset-y-20 flex items-center justify-center">
          <div className="relative aspect-[3/4] w-full max-w-sm">
            <div className="absolute inset-0 rounded-md border border-white/10 bg-white/5" />

            <Corner className="-left-px -top-px" />
            <Corner className="-right-px -top-px rotate-90" />
            <Corner className="-right-px -bottom-px rotate-180" />
            <Corner className="-left-px -bottom-px -rotate-90" />

            <div className="pointer-events-none absolute inset-x-0 h-1 animate-doku-scan bg-gradient-to-b from-white/60 to-transparent" />

            <div className="absolute inset-x-0 -bottom-10 text-center text-xs text-white/60">
              {auto ? "Detecting edges…" : "Tap shutter to capture"}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5 px-4 pb-[max(env(safe-area-inset-bottom),1.25rem)] pt-3">
        <div className="flex justify-center">
          <Tabs value={mode} onValueChange={setMode}>
            <TabsList className="bg-white/10">
              <TabsTrigger
                value="document"
                className="data-[state=active]:bg-white data-[state=active]:text-black"
              >
                Document
              </TabsTrigger>
              <TabsTrigger
                value="id"
                className="data-[state=active]:bg-white data-[state=active]:text-black"
              >
                ID Card
              </TabsTrigger>
              <TabsTrigger
                value="photo"
                className="data-[state=active]:bg-white data-[state=active]:text-black"
              >
                Photo
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid grid-cols-3 items-center">
          <div className="flex justify-start">
            <Button
              variant="ghost"
              size="icon-lg"
              aria-label="Open gallery"
              className="rounded-xl text-white hover:bg-white/10 hover:text-white"
            >
              <Images className="size-6" />
            </Button>
          </div>

          <div className="flex justify-center">
            <Link
              href="/scan/review"
              aria-label="Capture"
              className="group relative grid size-20 place-items-center rounded-full outline-none focus-visible:ring-4 focus-visible:ring-white/30"
            >
              <span className="absolute inset-0 rounded-full border-4 border-white" />
              <span className="size-15 rounded-full bg-white transition-transform group-active:scale-90" />
            </Link>
          </div>

          <div className="flex justify-end">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl text-xs font-medium text-white/80">
              0/1
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Corner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`absolute h-7 w-7 rounded-tl-md border-l-[3px] border-t-[3px] border-white ${className ?? ""}`}
    />
  );
}
