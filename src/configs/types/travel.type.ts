import type { TripEvent } from "./event.type";

export type TripValues = {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  cover: string | null;
};
export type Trip = TripValues & { id: string; events?: TripEvent[] };
export type TravelData = { trips: Trip[]; activeId: string | null };
export type DemoState = {
  username: string | null;
  accounts: Record<string, TravelData>;
};
