"use client";
import { useContext } from "react";
import { RemoteTravelProvider } from "./remote-travel-provider";
import { TravelContext } from "./travel-context";

export function TravelProvider({ children }: { children: React.ReactNode }) {
  return <RemoteTravelProvider>{children}</RemoteTravelProvider>;
}

export function useTravel() {
  const value = useContext(TravelContext);
  if (!value) throw new Error("TravelProvider is required");
  return value;
}
