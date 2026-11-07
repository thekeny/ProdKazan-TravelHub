export const MAP_POINT_COLORS = [
  "var(--map-point-sage)",
  "var(--map-point-sky)",
  "var(--map-point-sand)",
  "var(--map-point-peach)",
  "var(--map-point-rose)",
  "var(--map-point-lavender)",
] as const;

export const MAP = {
  tiles:
    process.env.NEXT_PUBLIC_MAP_TILE_URL ||
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  center: [30, 20] as [number, number],
  referrerPolicy: "strict-origin-when-cross-origin" as const,
  zoom: 2,
  pointZoom: 14,
  colors: {
    selected: "var(--primary)",
    marker: "var(--surface)",
    draft: "var(--text)",
    current: "var(--water)",
  },
};
