"use client";

import { Dialog } from "@base-ui/react/dialog";
import { ChevronRight, MapPin, Pencil, Plus, Trash2, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { EventIcon } from "@/components/dashboard/event-icon";
import { MaterialThumbnail } from "@/components/materials/material-thumbnail";
import { Button } from "@/components/ui/button";
import { DialogPopup } from "@/components/ui/dialog-popup";
import { EVENT_COLORS } from "@/configs/consts/events.const";
import type { TripEvent } from "@/configs/types/event.type";
import type { RoutePoint } from "@/configs/types/route.type";
import { actionToast } from "@/lib/action-toast";
import { useOnline } from "@/lib/connectivity";
import { eventTypeLabel } from "@/lib/event-types";
import { formatEventDate } from "@/lib/travel-events";
import { useTravel } from "@/providers/travel-provider";

export function PointDetails({
  point,
  events,
  onClose,
  onSelectEvent,
  onAddEvent,
  onEdit,
  onDelete,
}: {
  point: RoutePoint;
  events: readonly TripEvent[];
  onClose: () => void;
  onSelectEvent: (event: TripEvent) => void;
  onAddEvent: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { remote, activeId, setPointVisited } = useTravel();
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  const online = useOnline();
  const pointEvents = useMemo(
    () =>
      events
        .filter((event) => event.pointId === point.id)
        .sort(
          (a, b) => a.start.localeCompare(b.start) || a.id.localeCompare(b.id),
        ),
    [events, point.id],
  );
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="dialog-backdrop fixed inset-0 z-50 bg-overlay/35" />
        <DialogPopup className="dialog-popup fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l bg-background  outline-none">
          <header className="flex shrink-0 items-start justify-between gap-3 border-b p-4">
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">
                Точка маршрута
              </p>
              <Dialog.Title className="mt-1 user-text text-lg font-semibold">
                {point.name}
              </Dialog.Title>
              <Dialog.Description className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin aria-hidden="true" className="size-3.5" />
                {point.lat.toFixed(5)}, {point.lng.toFixed(5)}
              </Dialog.Description>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-10"
              aria-label="Закрыть карточку точки"
              onClick={onClose}
            >
              <X />
            </Button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {point.description && (
              <p className="mb-4 whitespace-pre-wrap user-text text-sm">
                {point.description}
              </p>
            )}
            <h3 className="text-sm font-semibold">
              События в этой точке
              {pointEvents.length > 0 && ` · ${pointEvents.length}`}
            </h3>
            {pointEvents.length ? (
              <ul className="mt-2 grid gap-2">
                {pointEvents.map((event) => (
                  <li key={event.id}>
                    <Button
                      variant="plain"
                      type="button"
                      onClick={() => onSelectEvent(event)}
                      className="flex w-full items-center gap-3 rounded-lg border bg-card p-3 text-left transition-colors hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                      <span
                        className="grid size-8 shrink-0 place-items-center rounded-md bg-secondary"
                        style={{ color: EVENT_COLORS[event.type] }}
                      >
                        <EventIcon type={event.type} className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block user-text whitespace-normal font-medium">
                          {event.title}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {eventTypeLabel(event)} ·{" "}
                          {formatEventDate(event.start)}
                        </span>
                      </span>
                      {event.materials.length > 0 && (
                        <span className="flex shrink-0 -space-x-2">
                          {event.materials.slice(0, 3).map((material) => (
                            <MaterialThumbnail
                              key={material.id}
                              material={material}
                              className="size-8 ring-2 ring-surface"
                            />
                          ))}
                        </span>
                      )}
                      <ChevronRight
                        aria-hidden="true"
                        className="size-4 shrink-0 text-muted-foreground"
                      />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                К этой точке пока не привязано ни одного события.
              </p>
            )}
          </div>
          <footer className="grid shrink-0 gap-2 border-t p-4">
            {remote && activeId && (
              <Button
                variant="outline"
                disabled={pending || !online}
                aria-pressed={point.visited ?? false}
                onClick={async () => {
                  if (busy.current) return;
                  busy.current = true;
                  setPending(true);
                  try {
                    await actionToast(
                      () => setPointVisited(activeId, point.id, !point.visited),
                      "Сохраняем…",
                      "Отметка обновлена.",
                    );
                  } catch {
                    /* actionToast displays the failure. */
                  } finally {
                    busy.current = false;
                    setPending(false);
                  }
                }}
              >
                {point.visited ? "Посещено" : "Отметить как посещённое"}
              </Button>
            )}
            <Button className="h-11 w-full" onClick={onAddEvent}>
              <Plus />
              Добавить событие в этой точке
            </Button>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="h-11 flex-1"
                onClick={onEdit}
              >
                <Pencil />
                Изменить точку
              </Button>
              <Button
                variant="destructive"
                className="h-11 flex-1"
                onClick={onDelete}
              >
                <Trash2 />
                Удалить
              </Button>
            </div>
          </footer>
        </DialogPopup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
