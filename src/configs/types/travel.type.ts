import type { TripEvent } from "./event.type";
import type { RoutePoint, TripLeg } from "./route.type";

export type TripValues = {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  cover: string | null;
};
export type Trip = TripValues & {
  id: string;
  isDemo?: boolean;
  events?: TripEvent[];
  points?: RoutePoint[];
  legs?: TripLeg[];
};
export type TravelData = { trips: Trip[]; activeId: string | null };
export type DemoState = {
  username: string | null;
  accounts: Record<string, TravelData>;
};
