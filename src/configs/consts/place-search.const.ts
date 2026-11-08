import { GATEWAY } from "@/configs/paths/gateway.path";

export const PLACE_SEARCH = {
  provider: "https://photon.komoot.io/api/",
  attribution: "https://www.openstreetmap.org/copyright",
  path: GATEWAY.placeSearch,
  minLength: 3,
  maxLength: 100,
  delay: 400,
  limit: 5,
  timeout: 8000,
  cacheSize: 20,
} as const;
