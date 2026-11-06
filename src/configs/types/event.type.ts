import type { EVENT_TYPES } from "@/configs/consts/events.const";
import type { Material } from "@/configs/types/material.type";

export type EventValues = {
  title: string;
  type: keyof typeof EVENT_TYPES;
  start: string;
  end: string;
  description: string;
  pointId: string | null;
  materials: Material[];
  bookingUrl: string;
};
export type TripEvent = EventValues & { id: string };
