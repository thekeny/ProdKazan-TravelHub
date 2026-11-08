// Keep frontend handlers outside /api, which production routes to the backend.
export const GATEWAY = {
  placeSearch: "/gateway/places/search",
} as const;
