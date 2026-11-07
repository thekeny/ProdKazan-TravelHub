"use client";

import { Dialog } from "@base-ui/react/dialog";
import { ArrowRight, MapPin, Plus, X } from "lucide-react";
import { EventIcon } from "@/components/dashboard/event-icon";
import { TransportIcon } from "@/components/dashboard/transport-icon";
import { MaterialThumbnail } from "@/components/materials/material-thumbnail";
import { Button } from "@/components/ui/button";
import { EVENT_COLORS, EVENT_TYPES } from "@/configs/consts/events.const";
import {
  TRANSPORT_STYLES,
  TRANSPORT_TYPES,
} from "@/configs/consts/transport.const";
import type { TripEvent } from "@/configs/types/event.type";
import type { RoutePoint, TripLeg } from "@/configs/types/route.type";
import { formatDayLabel } from "@/lib/travel-format";
import {
  itemEndMinutes,
  itemStartMinutes,
  minutesToTime,
  type TimelineItem,
} from "@/lib/travel-route";

function pointName(points: readonly RoutePoint[], id: string | null) {
  if (!id) return "Без места на карте";
  return points.find((point) => point.id === id)?.name ?? "Точка удалена";
}

function itemTime(item: TimelineItem, day: string) {
  const start = minutesToTime(itemStartMinutes(item));
  const end = itemEndMinutes(item, day);
  return end > itemStartMinutes(item)
    ? `${start}–${minutesToTime(end)}`
    : start;
}

export function DayFeed({
  items,
  day,
  points,
  onClose,
  onSelectEvent,
  onSelectLeg,
  onAddEvent,
}: {
  items: TimelineItem[];
  day: string;
  points: readonly RoutePoint[];
  onClose: () => void;
  onSelectEvent: (event: TripEvent) => void;
  onSelectLeg: (leg: TripLeg) => void;
  onAddEvent: () => void;
}) {
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-overlay/35" />
        <Dialog.Popup className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l bg-background shadow-xl outline-none">
          <header className="flex shrink-0 items-start justify-between gap-3 border-b p-4">
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">
                Лента дня
              </p>
              <Dialog.Title className="mt-1 text-lg font-semibold first-letter:uppercase">
                {formatDayLabel(day)}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-xs text-muted-foreground">
                События и перемещения по порядку. Нажмите на строку, чтобы
                открыть карточку.
              </Dialog.Description>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-10"
              aria-label="Закрыть ленту дня"
              onClick={onClose}
            >
              <X />
            </Button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {items.length ? (
              <ol className="grid gap-2">
                {items.map((item) => {
                  const event = item.kind === "event" ? item.event : null;
                  const leg = item.kind === "leg" ? item.leg : null;
                  const color = event
                    ? EVENT_COLORS[event.type]
                    : TRANSPORT_STYLES[leg?.transport ?? "walk"].color;
                  const title = event
                    ? event.title
                    : `${pointName(points, leg?.fromPointId ?? null)} → ${pointName(points, leg?.toPointId ?? null)}`;
                  const place = event ? pointName(points, event.pointId) : "";
                  const description = event?.description || leg?.description;
                  return (
                    <li key={`${item.kind}-${item.id}`}>
                      <button
                        type="button"
                        onClick={() => {
                          if (event) onSelectEvent(event);
                          else if (leg) onSelectLeg(leg);
                        }}
                        className="flex w-full gap-3 rounded-xl border bg-card p-3 text-left transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                      >
                        <span
                          aria-hidden="true"
                          className="mt-1 w-1 shrink-0 self-stretch rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2">
                            <span className="text-xs font-medium tabular-nums text-muted-foreground">
                              {itemTime(item, day)}
                            </span>
                            <span
                              className="flex items-center gap-1 text-[11px]"
                              style={{ color }}
                            >
                              {event ? (
                                <EventIcon
                                  type={event.type}
                                  className="size-3.5"
                                />
                              ) : (
                                <>
                                  <TransportIcon
                                    kind={leg?.transport ?? "walk"}
                                    className="size-3.5"
                                  />
                                  {TRANSPORT_TYPES[leg?.transport ?? "walk"]}
                                </>
                              )}
                            </span>
                          </span>
                          <span className="mt-1 block break-words font-medium">
                            {title}
                          </span>
                          {event && (
                            <span className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin aria-hidden="true" className="size-3" />
                              <span className="truncate">{place}</span>
                              <span className="shrink-0">
                                · {EVENT_TYPES[event.type]}
                              </span>
                            </span>
                          )}
                          {description && (
                            <span className="mt-1 line-clamp-2 block text-sm text-muted-foreground">
                              {description}
                            </span>
                          )}
                          {event && event.materials.length > 0 && (
                            <span className="mt-2 flex items-center gap-1.5">
                              {event.materials.slice(0, 3).map((material) => (
                                <MaterialThumbnail
                                  key={material.id}
                                  material={material}
                                  className="size-8"
                                />
                              ))}
                              <span className="text-xs text-muted-foreground">
                                Материалов: {event.materials.length}
                              </span>
                            </span>
                          )}
                          {event && event.end.slice(0, 10) > day && (
                            <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                              <ArrowRight
                                aria-hidden="true"
                                className="size-3"
                              />
                              Продолжается на следующий день
                            </span>
                          )}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <div className="rounded-xl border border-dashed p-5 text-center">
                <p className="text-sm font-medium">
                  В этот день пока ничего нет
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Добавьте событие или перемещение. Они появятся здесь по
                  порядку.
                </p>
              </div>
            )}
          </div>
          <footer className="shrink-0 border-t p-4">
            <Button className="h-11 w-full" onClick={onAddEvent}>
              <Plus />
              Добавить событие
            </Button>
          </footer>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
