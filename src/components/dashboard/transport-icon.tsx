"use client";

import {
  BusFront,
  Car,
  Footprints,
  Plane,
  Route,
  TrainFront,
} from "lucide-react";
import type { TransportKind } from "@/configs/consts/transport.const";

const icons = {
  walk: Footprints,
  car: Car,
  train: TrainFront,
  plane: Plane,
  bus: BusFront,
  other: Route,
} as const;

export function TransportIcon({
  kind,
  className = "size-4",
}: {
  kind: TransportKind;
  className?: string;
}) {
  const Icon = icons[kind];
  return <Icon aria-hidden="true" className={className} />;
}
