"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RoutePoint, TripLeg } from "@/configs/types/route.type";
import { LegItem } from "./route-leg-item";
import { PointItem } from "./route-point-item";
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
