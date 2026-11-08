// Keep frontend handlers outside /api, which production routes to the backend.
export const GATEWAY = {
  backend: "/gateway/backend",
  placeSearch: "/gateway/places/search",
} as const;
