import { Input } from "@/components/ui/input";

type ReviewNameFieldProps = {
  name: string;
  onNameChange: (name: string) => void;
};

export function ReviewNameField({
  name,
  onNameChange,
}: ReviewNameFieldProps) {
  return (
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
        onChange={(event) => onNameChange(event.target.value)}
        placeholder="Untitled document"
        className="h-12 text-base"
      />
    </div>
  );
}
