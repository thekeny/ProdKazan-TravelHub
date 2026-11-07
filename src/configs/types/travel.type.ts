import type { TripEvent } from "./event.type";
import type { RoutePoint, TripLeg } from "./route.type";

export type TripValues = {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  cover: string | null;
  eventTypes?: string[];
};
export type Trip = TripValues & {
  id: string;
  events?: TripEvent[];
  points?: RoutePoint[];
  legs?: TripLeg[];
};
export type TravelData = { trips: Trip[]; activeId: string | null };
export type TravelState = {
  username: string | null;
  accounts: Record<string, TravelData>;
};
