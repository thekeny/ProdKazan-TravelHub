"use client";

import { ArrowRight, Pencil, Trash2 } from "lucide-react";
import { useEffect, useRef } from "react";
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
import type { TripLeg } from "@/configs/types/route.type";
import {
  itemEndMinutes,
  itemStartMinutes,
  minutesToTime,
  type TimelineItem,
  type TripPosition,
} from "@/lib/travel-route";

const DAY_MINUTES = 1440;
const HOURS = Array.from({ length: 25 }, (_, index) => index);
const LABELS = [0, 3, 6, 9, 12, 15, 18, 21, 24];

function itemColor(item: TimelineItem) {
  return item.kind === "event"
    ? EVENT_COLORS[item.event.type]
    : TRANSPORT_STYLES[item.leg.transport].color;
}

function itemTitle(item: TimelineItem) {
  return item.kind === "event"
    ? item.event.title
    : `${TRANSPORT_TYPES[item.leg.transport]} · ${item.leg.description || "перемещение"}`;
}

function itemType(item: TimelineItem) {
  return item.kind === "event"
    ? EVENT_TYPES[item.event.type]
    : TRANSPORT_TYPES[item.leg.transport];
}

function continuesNextDay(item: TimelineItem, day: string) {
  const end = item.kind === "event" ? item.event.end : item.leg.end;
  return Boolean(end) && end.slice(0, 10) > day;
}

function hourLabel(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}

export function TripTimeline({
  items,
  day,
  minutes,
  position,
  onScrub,
  onSelectEvent,
  onSelectLeg,
  onEditEvent,
  onDeleteEvent,
  onEditLeg,
  onDeleteLeg,
  onHeightChange,
}: {
  items: TimelineItem[];
  day: string;
  minutes: number;
  position: TripPosition;
  onScrub: (minutes: number) => void;
  onSelectEvent: (event: TripEvent) => void;
  onSelectLeg: (leg: TripLeg) => void;
  onEditEvent: (event: TripEvent) => void;
  onDeleteEvent: (event: TripEvent) => void;
  onEditLeg: (leg: TripLeg) => void;
  onDeleteLeg: (leg: TripLeg) => void;
  onHeightChange?: (height: number) => void;
}) {
  const active = position.item;
  const percent = (minutes / DAY_MINUTES) * 100;
  const cardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const card = cardRef.current;
    if (!card || !onHeightChange) return;
    const observer = new ResizeObserver(() => {
      onHeightChange(Math.ceil(card.getBoundingClientRect().height + 32));
    });
    observer.observe(card);
    return () => observer.disconnect();
  }, [onHeightChange]);
  return (
    <section
      aria-label="Таймлайн дня"
      className="pointer-events-none absolute inset-x-0 bottom-0 z-20"
    >
      <div className="bg-gradient-to-t from-background via-background/80 to-transparent px-3 pt-8 pb-2">
        <div
          ref={cardRef}
          className="pointer-events-auto rounded-lg bg-surface/95 px-3 pt-1.5 pb-1 backdrop-blur"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1.5">
              {active ? (
                <span className="shrink-0" style={{ color: itemColor(active) }}>
                  {active.kind === "event" ? (
                    <EventIcon type={active.event.type} className="size-3.5" />
                  ) : (
                    <TransportIcon
                      kind={active.leg.transport}
                      className="size-3.5"
                    />
                  )}
                </span>
              ) : (
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-full bg-muted-foreground/40"
                />
              )}
              <span className="truncate text-[11px] text-muted-foreground">
                {position.label}
                {active && continuesNextDay(active, day) && " · продолжается"}
              </span>
            </div>
            {active && (
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-10"
                  aria-label={
                    active.kind === "event"
                      ? `Изменить событие «${active.event.title}»`
                      : "Изменить перемещение"
                  }
                  onClick={() =>
                    active.kind === "event"
                      ? onEditEvent(active.event)
                      : onEditLeg(active.leg)
                  }
                >
                  <Pencil />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-10 text-destructive"
                  aria-label={
                    active.kind === "event"
                      ? `Удалить событие «${active.event.title}»`
                      : "Удалить перемещение"
                  }
                  onClick={() =>
                    active.kind === "event"
                      ? onDeleteEvent(active.event)
                      : onDeleteLeg(active.leg)
                  }
                >
                  <Trash2 />
                </Button>
              </div>
            )}
          </div>

          <fieldset
            className="m-0 mt-1 hidden min-w-0 gap-1 overflow-x-auto border-0 p-0 pb-1 sm:flex"
            aria-label="События и перемещения дня"
          >
            <legend className="sr-only">События и перемещения дня</legend>
            {items.length ? (
              items.map((item) => {
                const continued = continuesNextDay(item, day);
                return (
                  <button
                    key={`${item.kind}-${item.id}`}
                    type="button"
                    className="flex min-h-9 max-w-64 shrink-0 items-center gap-1.5 rounded-md bg-background px-2 py-1 text-left text-[11px] transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    aria-label={`Открыть ${itemType(item)} «${itemTitle(item)}», ${minutesToTime(itemStartMinutes(item))}${continued ? ", продолжается на следующий день" : ""}`}
                    onClick={() =>
                      item.kind === "event"
                        ? onSelectEvent(item.event)
                        : onSelectLeg(item.leg)
                    }
                  >
                    <span
                      className="shrink-0"
                      style={{ color: itemColor(item) }}
                    >
                      {item.kind === "event" ? (
                        <EventIcon
                          type={item.event.type}
                          className="size-3.5"
                        />
                      ) : (
                        <TransportIcon
                          kind={item.leg.transport}
                          className="size-3.5"
                        />
                      )}
                    </span>
                    <span className="shrink-0 font-medium tabular-nums">
                      {minutesToTime(itemStartMinutes(item))}
                    </span>
                    <span className="min-w-0 truncate">{itemTitle(item)}</span>
                    {continued && (
                      <ArrowRight
                        aria-hidden="true"
                        className="size-3 shrink-0 text-muted-foreground"
                      />
                    )}
                    {item.kind === "event" && item.event.materials[0] && (
                      <MaterialThumbnail
                        material={item.event.materials[0]}
                        className="size-6 shrink-0"
                      />
                    )}
                  </button>
                );
              })
            ) : (
              <p className="px-1 py-1.5 text-[11px] text-muted-foreground">
                В этот день пока нет событий и перемещений.
              </p>
            )}
          </fieldset>

          <div className="relative mx-3 mt-0.5 h-[58px] rounded-md select-none focus-within:ring-2 focus-within:ring-ring">
            {items.map((item) => {
              const start = itemStartMinutes(item);
              const end = Math.max(itemEndMinutes(item, day), start + 5);
              const left = (start / DAY_MINUTES) * 100;
              const width = Math.min(
                Math.max(((end - start) / DAY_MINUTES) * 100, 1.2),
                100 - left,
              );
              return (
                <span
                  key={`${item.kind}-${item.id}`}
                  aria-hidden="true"
                  title={`${minutesToTime(start)} · ${itemType(item)}`}
                  className="pointer-events-none absolute top-[25px] h-1 rounded-full"
                  style={{
                    left: `${left}%`,
                    width: `${width}%`,
                    backgroundColor: itemColor(item),
                  }}
                />
              );
            })}
            {HOURS.map((hour) => (
              <span
                key={hour}
                aria-hidden="true"
                className={`pointer-events-none absolute top-[29px] w-px ${
                  hour % 3 === 0
                    ? "h-3 bg-muted-foreground/50"
                    : "h-2 bg-border"
                }`}
                style={{ left: `${(hour / 24) * 100}%` }}
              />
            ))}
            {LABELS.map((hour) => (
              <span
                key={hour}
                aria-hidden="true"
                className={`pointer-events-none absolute top-[43px] -translate-x-1/2 text-[10px] tabular-nums text-muted-foreground ${
                  hour % 6 === 0 ? "" : "hidden sm:block"
                }`}
                style={{ left: `${(hour / 24) * 100}%` }}
              >
                {hourLabel(hour)}
              </span>
            ))}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-[26px] bottom-[18px] w-px bg-primary"
              style={{ left: `${percent}%` }}
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-[27px] size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-surface bg-primary"
              style={{ left: `${percent}%` }}
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-0 -translate-x-1/2 rounded bg-primary-strong px-1.5 py-0.5 text-[11px] leading-4 font-semibold tabular-nums text-primary-foreground"
              style={{
                left: `clamp(24px, ${percent}%, calc(100% - 24px))`,
              }}
            >
              {minutesToTime(minutes)}
            </span>
            <input
              type="range"
              min={0}
              max={DAY_MINUTES}
              step={5}
              value={minutes}
              aria-label="Время дня"
              aria-valuetext={`${minutesToTime(minutes)}, ${position.label}`}
              className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
              onChange={(event) => onScrub(Number(event.target.value))}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
