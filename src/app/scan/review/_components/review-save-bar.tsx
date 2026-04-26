import { Button } from "@/components/ui/button";

type ReviewSaveBarProps = {
  onSave: () => void;
};

export function ReviewSaveBar({ onSave }: ReviewSaveBarProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 border-t bg-background/95 px-5 pb-[max(env(safe-area-inset-bottom),1rem)] pt-3 backdrop-blur">
      <Button
        onClick={onSave}
        size="lg"
        className="pointer-events-auto h-14 w-full rounded-full text-base"
      >
        Save Document
      </Button>
    </div>
  );
}
