import type { EVENT_TYPES } from "@/configs/consts/events.const";

export type EventPlace = { name: string; lat: number; lng: number };
export type EventValues = {
  title: string;
  type: keyof typeof EVENT_TYPES;
  start: string;
  end: string;
  description: string;
  place: EventPlace | null;
};
export type TripEvent = EventValues & { id: string };
