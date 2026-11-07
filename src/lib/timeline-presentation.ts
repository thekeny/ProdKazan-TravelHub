import { EVENT_COLORS } from "@/configs/consts/events.const";
import {
  TRANSPORT_STYLES,
  TRANSPORT_TYPES,
} from "@/configs/consts/transport.const";
import { eventTypeLabel } from "@/lib/event-types";
import type { TimelineItem } from "@/lib/travel-route";

export function itemColor(item: TimelineItem) {
  return item.kind === "event"
    ? EVENT_COLORS[item.event.type]
    : TRANSPORT_STYLES[item.leg.transport].color;
}

export function itemTitle(item: TimelineItem) {
  return item.kind === "event"
    ? item.event.title
    : `${TRANSPORT_TYPES[item.leg.transport]} · ${item.leg.description || "перемещение"}`;
}

export function itemType(item: TimelineItem) {
  return item.kind === "event"
    ? eventTypeLabel(item.event)
    : TRANSPORT_TYPES[item.leg.transport];
}

export function continuesNextDay(item: TimelineItem, day: string) {
  const end = item.kind === "event" ? item.event.end : item.leg.end;
  return Boolean(end) && end.slice(0, 10) > day;
}

export function hourLabel(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}
