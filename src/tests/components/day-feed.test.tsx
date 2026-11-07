import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DayFeed } from "@/components/dashboard/day-feed";
import type { TripEvent } from "@/configs/types/event.type";
import type { RoutePoint, TripLeg } from "@/configs/types/route.type";
import type { TimelineItem } from "@/lib/travel-route";

vi.mock("@/lib/material-storage", () => ({
  getMaterialFile: vi.fn(async () => null),
}));

const hotel: RoutePoint = {
  id: "hotel",
  name: "Гостиница",
  description: "",
  lat: 55.8,
  lng: 49.1,
};
const event: TripEvent = {
  id: "event",
  title: "Экскурсия",
  type: "tour",
  start: "2026-05-01T10:00",
  end: "2026-05-01T12:00",
  description: "Кремль",
  pointId: "hotel",
  materials: [
    {
      id: "material",
      name: "ticket.png",
      mimeType: "image/png",
      size: 1024,
      kind: "document",
      createdAt: "2026-05-01T09:00:00.000Z",
    },
  ],
  bookingUrl: "",
};
const leg: TripLeg = {
  id: "leg",
  fromPointId: "hotel",
  toPointId: "hotel",
  transport: "walk",
  start: "2026-05-01T09:00",
  end: "2026-05-01T09:30",
  description: "До Кремля",
};
const items: TimelineItem[] = [
  { kind: "leg", id: leg.id, at: leg.start, leg },
  { kind: "event", id: event.id, at: event.start, event },
];

let root: Root;
let container: HTMLDivElement;

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  document.body.innerHTML = "";
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("day feed", () => {
  it("lists events and movements in order and opens a card", async () => {
    const onSelectEvent = vi.fn();
    await act(async () =>
      root.render(
        <DayFeed
          items={items}
          day="2026-05-01"
          points={[hotel]}
          onClose={() => {}}
          onSelectEvent={onSelectEvent}
          onSelectLeg={() => {}}
          onAddEvent={() => {}}
        />,
      ),
    );
    const text = document.body.textContent ?? "";
    expect(text).toContain("Лента дня");
    expect(text).toContain("09:00–09:30");
    expect(text).toContain("10:00–12:00");
    expect(text).toContain("Экскурсия");
    expect(text).toContain("Кремль");
    expect(text).toContain("Пешком");
    expect(text).toContain("Материалов: 1");
    const eventRow = Array.from(document.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Экскурсия"),
    );
    await act(async () => eventRow?.click());
    expect(onSelectEvent).toHaveBeenCalledWith(event);
  });
});
