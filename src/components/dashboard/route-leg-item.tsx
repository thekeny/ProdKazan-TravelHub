"use client";

import { Pencil, Trash2 } from "lucide-react";
import { TransportIcon } from "@/components/dashboard/transport-icon";
import { Button } from "@/components/ui/button";
import { TRANSPORT_TYPES } from "@/configs/consts/transport.const";
import type { RoutePoint, TripLeg } from "@/configs/types/route.type";
import { formatEventDate } from "@/lib/travel-events";

export function LegItem({
  leg,
  from,
  to,
  selected,
  onSelect,
  onEdit,
  onDelete,
}: {
  leg: TripLeg;
  from?: RoutePoint;
  to?: RoutePoint;
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
          className="flex min-w-0 flex-1 gap-3 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-pressed={selected}
          onClick={onSelect}
        >
          <span className="grid size-7 shrink-0 place-items-center rounded-md bg-secondary text-primary-strong">
            <TransportIcon kind={leg.transport} className="size-3.5" />
          </span>
          <span className="min-w-0">
            <span className="block user-text font-medium">
              {from?.name ?? "Точка удалена"} → {to?.name ?? "Точка удалена"}
            </span>
            <span className="mt-1 block text-xs text-muted-foreground">
              {TRANSPORT_TYPES[leg.transport]} · {formatEventDate(leg.start)} —{" "}
              {formatEventDate(leg.end)}
            </span>
            {leg.description && (
              <span className="mt-2 block user-text text-sm text-muted-foreground whitespace-pre-wrap">
                {leg.description}
              </span>
            )}
          </span>
        </Button>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="size-9"
            aria-label="Изменить перемещение"
            onClick={onEdit}
          >
            <Pencil />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-9 text-muted-foreground hover:text-destructive focus-visible:text-destructive"
            aria-label="Удалить перемещение"
            onClick={onDelete}
          >
            <Trash2 />
          </Button>
        </div>
      </div>
    </li>
  );
}
