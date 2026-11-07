export const MAP = {
  tiles:
    process.env.NEXT_PUBLIC_MAP_TILE_URL ||
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  // The deployment sets no-referrer, but OpenStreetMap needs the site origin.
  referrerPolicy: "strict-origin-when-cross-origin" as const,
  center: [30, 20] as [number, number],
  zoom: 2,
  pointZoom: 14,
  colors: {
    selected: "var(--primary)",
    marker: "var(--green)",
    fill: "var(--surface)",
    draft: "var(--text)",
  },
};
