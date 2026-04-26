import Link from "next/link";
import { useState } from "react";
import { Sparkles, X, Zap, ZapOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useScanDraftActions,
  useScanDraftStore,
} from "../_providers/scan-provider";

export function ScanHeader() {
  const [flash, setFlash] = useState(false);
  const auto = useScanDraftStore((state) => state.auto);
  const { toggleAuto } = useScanDraftActions();

  return (
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
        onClick={toggleAuto}
        className="h-8 gap-1.5 rounded-full bg-white/10 px-3 text-xs font-medium text-white hover:bg-white/20 hover:text-white"
      >
        <Sparkles className="size-3.5" />
        {auto ? "Auto" : "Manual"}
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => setFlash((current) => !current)}
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
  );
}
