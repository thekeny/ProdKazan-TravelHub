import type { EVENT_TYPES } from "@/configs/consts/events.const";
import type { Material } from "@/configs/types/material.type";

export type EventValues = {
  title: string;
  type: keyof typeof EVENT_TYPES;
  /** One type from the trip catalog; undefined preserves legacy events. */
  customType?: string | null;
  start: string;
  end: string;
  description: string;
  pointId: string | null;
  materials: Material[];
  bookingUrl: string;
};
export type TripEvent = EventValues & { id: string };
