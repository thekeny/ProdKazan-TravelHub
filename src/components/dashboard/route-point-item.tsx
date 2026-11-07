"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RoutePoint } from "@/configs/types/route.type";

export function PointItem({
  point,
  index,
  selected,
  onSelect,
  onEdit,
  onDelete,
}: {
  point: RoutePoint;
  index: number;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <li
      className={`rounded-xl p-3 transition-colors ${selected ? "bg-muted" : "bg-card"}`}
    >
      <div className="flex items-start gap-3">
        <Button
          variant="plain"
          type="button"
          className="flex min-w-0 flex-1 cursor-pointer gap-3 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-pressed={selected}
          onClick={onSelect}
        >
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-muted text-[11px] font-medium tabular-nums text-muted-foreground">
            {index + 1}
          </span>
          <span className="min-w-0">
            <span className="block user-text font-medium">{point.name}</span>
            {point.description && (
              <span className="mt-1 block user-text text-sm text-muted-foreground whitespace-pre-wrap">
                {point.description}
              </span>
            )}
          </span>
        </Button>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="size-9"
            aria-label={`Изменить точку «${point.name}»`}
            onClick={onEdit}
          >
            <Pencil />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-9 text-muted-foreground hover:text-destructive focus-visible:text-destructive"
            aria-label={`Удалить точку «${point.name}»`}
            onClick={onDelete}
          >
            <Trash2 />
          </Button>
        </div>
      </div>
    </li>
  );
}
