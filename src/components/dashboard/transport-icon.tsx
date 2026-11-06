"use client";

import { BusFront, Car, Footprints, Plane, TrainFront } from "lucide-react";
import type { TransportKind } from "@/configs/consts/transport.const";

const icons = {
  walk: Footprints,
  car: Car,
  train: TrainFront,
  plane: Plane,
  bus: BusFront,
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
