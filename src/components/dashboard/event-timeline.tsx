"use client";

import { MapPin, Pencil, Trash2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { EVENT_TYPES } from "@/configs/consts/events.const";
import type { TripEvent } from "@/configs/types/event.type";
import { formatEventDate } from "@/lib/travel-events";

export function EventTimeline({
  events,
  selectedId,
  onSelect,
  onEdit,
  onDelete,
}: {
  events: TripEvent[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onEdit: (event: TripEvent) => void;
  onDelete: (event: TripEvent) => void;
}) {
  const list = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (selectedId)
      list.current
        ?.querySelector('[data-selected="true"]')
        ?.scrollIntoView({ block: "nearest", behavior: "instant" });
  }, [selectedId]);
  return (
    <div
      ref={list}
      className="grid content-start gap-3 xl:max-h-[640px] xl:overflow-y-auto xl:pr-1"
    >
      {events.map((event) => (
        <article
          key={event.id}
          data-selected={selectedId === event.id}
          className={`rounded-xl border border-border p-4 transition-colors ${
            selectedId === event.id ? "bg-muted" : "bg-card"
          }`}
        >
          <button
            type="button"
            className="w-full cursor-pointer rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-pressed={selectedId === event.id}
            onClick={() => onSelect(event.id)}
          >
            <span className="text-xs text-muted-foreground">
              {EVENT_TYPES[event.type]}
            </span>
            <h3 className="mt-1 break-words font-semibold">{event.title}</h3>
            <p className="mt-2 text-sm tabular-nums">
              {formatEventDate(event.start)}
              {event.end && <> — {formatEventDate(event.end)}</>}
            </p>
            <span className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="size-4 shrink-0" />
              {event.place?.name ?? "Без места на карте"}
            </span>
            {event.description && (
              <p className="mt-3 whitespace-pre-wrap break-words text-sm text-muted-foreground">
                {event.description}
              </p>
            )}
          </button>
          <div className="mt-3 flex gap-2 border-t pt-2">
            <Button
              variant="ghost"
              className="h-11"
              onClick={() => onEdit(event)}
            >
              <Pencil />
              Изменить
            </Button>
            <Button
              variant="ghost"
              className="ml-auto size-11 text-destructive"
              aria-label={`Удалить событие «${event.title}»`}
              onClick={() => onDelete(event)}
            >
              <Trash2 />
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}
