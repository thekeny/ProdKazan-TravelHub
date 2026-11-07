import { createContext } from "react";
import type {
  TripCollaborators,
  TripInviteLink,
} from "@/api/generated/types.gen";
import type { EventValues } from "@/configs/types/event.type";
import type {
  RoutePointValues,
  TripLegValues,
} from "@/configs/types/route.type";
import type { TravelData, TripValues } from "@/configs/types/travel.type";
export type TravelContextValue = TravelData & {
  ready: boolean;
  username: string | null;
  storageWarning: string | null;
  dismissStorageWarning: () => void;
  remote?: boolean;
  user?: import("@/api/generated/types.gen").User;
  login: (
    name: string,
    password?: string,
    register?: boolean,
  ) => void | Promise<void>;
  logout: () => void | Promise<void>;
  deleteAccount: (password: string) => void | Promise<void>;
  renameAccount: (name: string) => void | Promise<void>;
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<void>;
  createTrip: (values: TripValues) => void | Promise<void>;
  saveTrip: (tripId: string, values: TripValues) => void | Promise<void>;
  addEventType: (tripId: string, name: string) => void | Promise<void>;
  deleteTrip: (tripId: string) => void | Promise<void>;
  selectTrip: (id: string) => void;
  saveEvent: (
    tripId: string,
    values: EventValues,
    eventId?: string,
  ) => string | Promise<string>;
  deleteEvent: (tripId: string, eventId: string) => void | Promise<void>;
  savePoint: (
    tripId: string,
    values: RoutePointValues,
    pointId?: string,
  ) => string | Promise<string>;
  deletePoint: (tripId: string, pointId: string) => void | Promise<void>;
  saveLeg: (
    tripId: string,
    values: TripLegValues,
    legId?: string,
  ) => string | Promise<string>;
  deleteLeg: (tripId: string, legId: string) => void | Promise<void>;
  loadCollaborators: (tripId: string) => Promise<TripCollaborators>;
  generateInviteCode: (
    tripId: string,
    maxUses?: number,
  ) => Promise<TripInviteLink>;
  joinTrip: (code: string) => Promise<string | null>;
};
export const TravelContext = createContext<TravelContextValue | null>(null);
