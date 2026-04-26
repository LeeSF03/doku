import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ReviewSaveBar() {
  const router = useRouter();
  const [name, setName] = useState("");

  const handleSave = () => {
    toast.success("Document saved", {
      description: name || "Untitled document",
    });
    router.push("/");
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 border-t bg-background/95 px-5 pb-[max(env(safe-area-inset-bottom),1rem)] pt-3 backdrop-blur">
      <div className="pointer-events-auto space-y-3">
        <div className="space-y-2">
          <label
            htmlFor="doc-name"
            className="px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground"
          >
            Name
          </label>
          <Input
            id="doc-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Untitled document"
            className="h-12 text-base"
          />
        </div>

        <Button
          onClick={handleSave}
          size="lg"
          className="h-14 w-full rounded-full text-base"
        >
          Save Document
        </Button>
      </div>
    </div>
  );
}
