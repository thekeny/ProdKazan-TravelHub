export const INTEGRATIONS = {
  archiveBytes: 1024 * 1024,
  ticketBytes: 900 * 1024,
  photoBytes: 10_000_000,
  photoPixels: 25_000_000,
  retryDelayMs: 60_000,
};
export const TICKET_KINDS = {
  plane: "Самолёт",
  train: "Поезд",
  ship: "Корабль",
  stay: "Проживание",
} as const;
