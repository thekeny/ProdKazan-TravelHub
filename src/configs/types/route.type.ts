import type { TransportKind } from "@/configs/consts/transport.const";

export type RoutePointValues = {
  name: string;
  description: string;
  lat: number;
  lng: number;
};

export type RoutePoint = RoutePointValues & { id: string; visited?: boolean };

export type TripLegValues = {
  fromPointId: string;
  toPointId: string;
  transport: TransportKind;
  start: string;
  end: string;
  description: string;
};

export type TripLeg = TripLegValues & { id: string };
