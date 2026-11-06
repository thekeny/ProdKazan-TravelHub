import {
  CircleDot,
  Footprints,
  Hotel,
  Landmark,
  Users,
  Utensils,
} from "lucide-react";
import type { EVENT_TYPES } from "@/configs/consts/events.const";

const icons = {
  walk: Footprints,
  tour: Landmark,
  stay: Hotel,
  restaurant: Utensils,
  meeting: Users,
  other: CircleDot,
} as const;

export function EventIcon({
  type,
  className = "size-3.5",
}: {
  type: keyof typeof EVENT_TYPES;
  className?: string;
}) {
  const Icon = icons[type];
  return <Icon aria-hidden="true" className={className} />;
}
