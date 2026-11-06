export const TRANSPORT_TYPES = {
  walk: "Пешком",
  car: "Автомобиль",
  train: "Поезд",
  plane: "Самолёт",
  bus: "Автобус",
} as const;

export type TransportKind = keyof typeof TRANSPORT_TYPES;

type TransportStyle = {
  color: string;
  dashArray?: string;
  weight: number;
};

export const TRANSPORT_STYLES: Record<TransportKind, TransportStyle> = {
  walk: { color: "var(--transport-walk)", dashArray: "2 7", weight: 3 },
  car: { color: "var(--transport-car)", weight: 4 },
  train: { color: "var(--transport-train)", dashArray: "10 6", weight: 4 },
  plane: { color: "var(--transport-plane)", dashArray: "4 10", weight: 3 },
  bus: { color: "var(--transport-bus)", dashArray: "7 5", weight: 4 },
};
