"use client";

import { Dialog } from "@base-ui/react/dialog";
import {
  CalendarClock,
  ExternalLink,
  MapPin,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { EventIcon } from "@/components/dashboard/event-icon";
import { MaterialGrid } from "@/components/materials/material-grid";
import { Button } from "@/components/ui/button";
import { DialogPopup } from "@/components/ui/dialog-popup";
import { EVENT_COLORS } from "@/configs/consts/events.const";
import type { TripEvent } from "@/configs/types/event.type";
import type { RoutePoint } from "@/configs/types/route.type";
import { eventTypeLabel } from "@/lib/event-types";
import { formatEventDate, formatEventDateRange } from "@/lib/travel-events";

export function EventDetails({
  event,
  points,
  onClose,
  onEdit,
  onDelete,
}: {
  event: TripEvent;
  points: readonly RoutePoint[];
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const point = event.pointId
    ? points.find((item) => item.id === event.pointId)
    : null;
  const continues =
    Boolean(event.end) && event.end.slice(0, 10) > event.start.slice(0, 10);
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
              <p className="user-text flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <span style={{ color: EVENT_COLORS[event.type] }}>
                  <EventIcon type={event.type} className="size-3.5" />
                </span>
                {eventTypeLabel(event)}
              </p>
              <Dialog.Title className="mt-1 user-text text-lg font-semibold">
                {event.title}
              </Dialog.Title>
              <Dialog.Description className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarClock aria-hidden="true" className="size-3.5" />
                {formatEventDateRange(event.start, event.end)}
              </Dialog.Description>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-10"
              aria-label="Закрыть карточку события"
              onClick={onClose}
            >
              <X />
            </Button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <dl className="grid gap-4">
              <div>
                <dt className="text-xs font-medium text-muted-foreground">
                  Место
                </dt>
                <dd className="mt-1 flex items-center gap-1.5 text-sm">
                  <MapPin aria-hidden="true" className="size-4 shrink-0" />
                  {point?.name ?? "Без места на карте"}
                </dd>
              </div>
              {continues && (
                <p className="rounded-lg bg-muted p-3 text-sm">
                  Событие заканчивается {formatEventDate(event.end)} на
                  следующий день.
                </p>
              )}
              <div>
                <dt className="text-xs font-medium text-muted-foreground">
                  Описание
                </dt>
                <dd className="mt-1 whitespace-pre-wrap user-text text-sm">
                  {event.description || "Без описания."}
                </dd>
              </div>
              {event.bookingUrl && (
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">
                    Билет или бронирование
                  </dt>
                  <dd className="mt-1">
                    <a
                      href={event.bookingUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex min-h-9 items-center gap-1.5 text-sm text-primary-strong underline-offset-4 hover:underline"
                    >
                      Открыть билет или бронь
                      <ExternalLink aria-hidden="true" className="size-3.5" />
                    </a>
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-medium text-muted-foreground">
                  Материалы
                </dt>
                <dd className="mt-2">
                  <MaterialGrid materials={event.materials} />
                </dd>
              </div>
            </dl>
          </div>
          <footer className="flex shrink-0 gap-3 border-t p-4">
            <Button variant="outline" className="h-11 flex-1" onClick={onEdit}>
              <Pencil />
              Изменить
            </Button>
            <Button
              variant="destructive"
              className="h-11 flex-1"
              onClick={onDelete}
            >
              <Trash2 />
              Удалить
            </Button>
          </footer>
        </DialogPopup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
