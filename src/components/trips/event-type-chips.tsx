"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EventTypeChips({
  value,
  onChange,
  disabled = false,
}: {
  value: string[];
  onChange: (names: string[]) => void;
  disabled?: boolean;
}) {
  if (!value.length) return null;
  return (
    <div className="grid min-w-0 gap-2">
      <p className="text-sm font-medium">Теги событий</p>
      <div className="flex flex-wrap gap-2">
        {value.map((name) => (
          <span
            key={name}
            className="inline-flex max-w-full items-center rounded-xl border border-primary/25 bg-primary/10 pl-3 text-sm"
          >
            <span className="user-text min-w-0">{name}</span>
            <Button
              variant="plain"
              type="button"
              disabled={disabled}
              aria-label={`Убрать тег «${name}»`}
              className="flex size-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50"
              onClick={() => onChange(value.filter((item) => item !== name))}
            >
              <X aria-hidden="true" className="size-3.5" />
            </Button>
          </span>
        ))}
      </div>
    </div>
  );
}
