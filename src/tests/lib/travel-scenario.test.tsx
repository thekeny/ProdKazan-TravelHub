import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Material } from "@/configs/types/material.type";
import { eventsForDay, tripDays } from "@/lib/travel-events";
import { buildTimeline, legsForDay, pointsForDay } from "@/lib/travel-route";
import { TravelProvider, useTravel } from "@/providers/travel-provider";

let travel: ReturnType<typeof useTravel>;
let root: Root;
let container: HTMLDivElement;
function Probe() {
  travel = useTravel();
  return null;
}
async function mount() {
  root = createRoot(container);
  await act(async () => {
    root.render(
      <TravelProvider>
        <Probe />
      </TravelProvider>,
    );
  });
}
async function clearTrips() {
  while (travel.trips.length)
    await act(async () => travel.deleteTrip(travel.trips[0].id));
}

const tripValues = {
  name: "Санкт-Петербург → Казань",
  description: "Четыре дня",
  startDate: "2026-05-01",
  endDate: "2026-05-04",
  cover: null,
};
const material: Material = {
  id: "material-1",
  name: "ticket.webp",
  mimeType: "image/webp",
  size: 2048,
  kind: "document",
  createdAt: "2026-05-01T09:00:00.000Z",
};

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 4, 1, 12));
  localStorage.clear();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  await mount();
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("MVP scenario from the case", () => {
  it("builds a trip, fills days, survives reload and cascades deletion", async () => {
    await act(async () => travel.login("traveler"));
    await clearTrips();
    await act(async () => travel.createTrip(tripValues));
    const tripId = travel.activeId as string;

    await act(async () =>
      travel.savePoint(tripId, {
        name: "Московский вокзал",
        description: "",
        lat: 59.9296,
        lng: 30.3614,
      }),
    );
    await act(async () =>
      travel.savePoint(tripId, {
        name: "Аэропорт Казани",
        description: "",
        lat: 55.6062,
        lng: 49.2787,
      }),
    );
    await act(async () =>
      travel.savePoint(tripId, {
        name: "Гостиница",
        description: "",
        lat: 55.7963,
        lng: 49.1064,
      }),
    );
    const points =
      travel.trips.find((trip) => trip.id === tripId)?.points ?? [];
    const station = points.find((point) => point.name === "Московский вокзал");
    const airport = points.find((point) => point.name === "Аэропорт Казани");
    const hotel = points.find((point) => point.name === "Гостиница");

    await act(async () =>
      travel.saveLeg(tripId, {
        fromPointId: station?.id as string,
        toPointId: airport?.id as string,
        transport: "plane",
        start: "2026-05-01T08:00",
        end: "2026-05-01T11:00",
        description: "Перелёт",
      }),
    );
    await act(async () =>
      travel.saveLeg(tripId, {
        fromPointId: airport?.id as string,
        toPointId: hotel?.id as string,
        transport: "car",
        start: "2026-05-01T11:30",
        end: "2026-05-01T12:15",
        description: "Трансфер",
      }),
    );
    await act(async () =>
      travel.saveEvent(tripId, {
        title: "Экскурсия",
        type: "tour",
        start: "2026-05-02T10:00",
        end: "2026-05-02T12:00",
        description: "Кремль",
        pointId: hotel?.id ?? null,
        materials: [material],
        bookingUrl: "https://example.com/ticket",
      }),
    );
    await act(async () =>
      travel.saveEvent(tripId, {
        title: "Ужин",
        type: "restaurant",
        start: "2026-05-02T19:00",
        end: "2026-05-02T21:00",
        description: "",
        pointId: null,
        materials: [],
        bookingUrl: "",
      }),
    );

    await act(async () => root.unmount());
    await mount();
    const trip = travel.trips.find((item) => item.id === tripId);
    expect(trip?.events).toHaveLength(2);
    expect(trip?.events?.[0].materials[0]).toMatchObject(material);
    expect(trip?.events?.[0].bookingUrl).toBe("https://example.com/ticket");
    expect(tripDays(trip ?? tripValues)).toHaveLength(4);
    expect(
      pointsForDay(
        trip?.points ?? [],
        trip?.events ?? [],
        trip?.legs ?? [],
        "2026-05-01",
      ).length,
    ).toBeGreaterThan(0);
    expect(legsForDay(trip?.legs ?? [], "2026-05-01")).toHaveLength(2);
    expect(
      eventsForDay(trip?.events ?? [], "2026-05-02").map(
        (event) => event.title,
      ),
    ).toEqual(["Экскурсия", "Ужин"]);
    expect(
      buildTimeline(trip?.events ?? [], trip?.legs ?? [], "2026-05-01").map(
        (item) => item.kind,
      ),
    ).toEqual(["leg", "leg"]);

    const eventId = trip?.events?.[0].id as string;
    await act(async () => travel.deleteEvent(tripId, eventId));
    expect(
      travel.trips.find((item) => item.id === tripId)?.events,
    ).toHaveLength(1);
    await act(async () => travel.deleteTrip(tripId));
    expect(travel.trips).toEqual([]);
    expect(travel.activeId).toBeNull();
  });
});
