import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DocumentVisibility } from "@/hooks/use-document-visibility";

export function DocumentVisibilityToggle({
  visibility,
}: {
  visibility: DocumentVisibility;
}) {
  if (!visibility.hasDocuments) return null;
  const Icon = visibility.allVisible ? EyeOff : Eye;
  return (
    <Button
      type="button"
      variant="outline"
      className="min-h-11 whitespace-normal"
      aria-pressed={visibility.allVisible}
      onClick={visibility.toggleAll}
    >
      <Icon aria-hidden="true" />
      {visibility.allVisible ? "Скрыть все" : "Показать все"}
    </Button>
  );
}
