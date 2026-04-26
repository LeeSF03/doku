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
        <Input
          id="doc-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Untitled document"
          className="h-9 rounded-none border-0 border-b border-border bg-transparent px-1 text-sm shadow-none focus-visible:border-foreground focus-visible:ring-0"
        />

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
