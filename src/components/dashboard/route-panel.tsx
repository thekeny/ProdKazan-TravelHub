"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { TransportIcon } from "@/components/dashboard/transport-icon";
import { Button } from "@/components/ui/button";
import { TRANSPORT_TYPES } from "@/configs/consts/transport.const";
import type { RoutePoint, TripLeg } from "@/configs/types/route.type";
import { formatEventDate } from "@/lib/travel-events";

function PointItem({
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
      className={`rounded-xl border p-3 transition-colors ${selected ? "border-primary/50 bg-muted" : "border-border bg-card"}`}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          className="flex min-w-0 flex-1 cursor-pointer gap-3 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-pressed={selected}
          onClick={onSelect}
        >
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-muted text-[11px] font-medium tabular-nums text-muted-foreground">
            {index + 1}
          </span>
          <span className="min-w-0">
            <span className="block break-words font-medium">{point.name}</span>
            {point.description && (
              <span className="mt-1 block break-words text-sm text-muted-foreground">
                {point.description}
              </span>
            )}
          </span>
        </button>
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

function LegItem({
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
      className={`rounded-xl border p-3 transition-colors ${selected ? "border-primary/50 bg-muted" : "border-border bg-card"}`}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          className="flex min-w-0 flex-1 gap-3 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-pressed={selected}
          onClick={onSelect}
        >
          <span className="grid size-7 shrink-0 place-items-center rounded-md bg-secondary text-primary-strong">
            <TransportIcon kind={leg.transport} className="size-3.5" />
          </span>
          <span className="min-w-0">
            <span className="block break-words font-medium">
              {from?.name ?? "Точка удалена"} → {to?.name ?? "Точка удалена"}
            </span>
            <span className="mt-1 block text-xs text-muted-foreground">
              {TRANSPORT_TYPES[leg.transport]} · {formatEventDate(leg.start)} —{" "}
              {formatEventDate(leg.end)}
            </span>
            {leg.description && (
              <span className="mt-2 block break-words text-sm text-muted-foreground">
                {leg.description}
              </span>
            )}
          </span>
        </button>
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

export function RoutePanel({
  points,
  legs,
  selectedPointId,
  selectedLegId,
  onSelectPoint,
  onSelectLeg,
  onAddPoint,
  onEditPoint,
  onDeletePoint,
  onAddLeg,
  onEditLeg,
  onDeleteLeg,
}: {
  points: RoutePoint[];
  legs: TripLeg[];
  selectedPointId: string | null;
  selectedLegId: string | null;
  onSelectPoint: (id: string) => void;
  onSelectLeg: (id: string) => void;
  onAddPoint: () => void;
  onEditPoint: (point: RoutePoint) => void;
  onDeletePoint: (point: RoutePoint) => void;
  onAddLeg: () => void;
  onEditLeg: (leg: TripLeg) => void;
  onDeleteLeg: (leg: TripLeg) => void;
}) {
  const byId = new Map(points.map((point) => [point.id, point]));
  const orderedLegs = [...legs].sort(
    (a, b) => a.start.localeCompare(b.start) || a.id.localeCompare(b.id),
  );
  return (
    <div className="grid gap-8">
      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-medium">Точки маршрута</h3>
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={onAddPoint}
          >
            <Plus />
            Добавить точку
          </Button>
        </div>
        {points.length ? (
          <ol className="grid gap-2">
            {points.map((point, index) => (
              <PointItem
                key={point.id}
                point={point}
                index={index}
                selected={point.id === selectedPointId}
                onSelect={() => onSelectPoint(point.id)}
                onEdit={() => onEditPoint(point)}
                onDelete={() => onDeletePoint(point)}
              />
            ))}
          </ol>
        ) : (
          <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            Добавьте первую точку. На странице появятся маршрут и место для
            событий.
          </p>
        )}
      </section>
      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-medium">Перемещения</h3>
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            disabled={points.length < 2}
            onClick={onAddLeg}
          >
            <Plus />
            Добавить перемещение
          </Button>
        </div>
        {orderedLegs.length ? (
          <ol className="grid gap-2">
            {orderedLegs.map((leg) => (
              <LegItem
                key={leg.id}
                leg={leg}
                from={byId.get(leg.fromPointId)}
                to={byId.get(leg.toPointId)}
                selected={leg.id === selectedLegId}
                onSelect={() => onSelectLeg(leg.id)}
                onEdit={() => onEditLeg(leg)}
                onDelete={() => onDeleteLeg(leg)}
              />
            ))}
          </ol>
        ) : (
          <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            {points.length < 2
              ? "Для перемещения нужно как минимум две точки."
              : "Соедините точки, чтобы показать, как вы добираетесь между ними."}
          </p>
        )}
      </section>
    </div>
  );
}
