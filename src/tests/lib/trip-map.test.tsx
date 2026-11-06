import { act, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import TripMap from "@/components/dashboard/trip-map";
import type { EventPlace } from "@/configs/types/event.type";

const map = vi.hoisted(() => ({
  invalidateSize: vi.fn(),
  getContainer: vi.fn(() => document.createElement("div")),
  fitBounds: vi.fn(),
  setView: vi.fn(),
  panTo: vi.fn(),
}));
vi.mock("leaflet/dist/leaflet.css", () => ({}));
vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  CircleMarker: () => null,
  TileLayer: () => null,
  Popup: () => null,
  useMap: () => map,
  useMapEvents: () => map,
}));

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

it("keeps the map viewport when placing a point or editing its fields", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
  const container = document.createElement("div");
  const root = createRoot(container);
  const render = async (place: EventPlace | null) => {
    await act(async () =>
      root.render(
        <TripMap
          events={[]}
          selectedId={null}
          onSelect={() => {}}
          onPlace={() => {}}
          draftPlace={place}
        />,
      ),
    );
  };
  try {
    await render(null);
    await render({ name: "Место", lat: 55, lng: 49 });
    await render({ name: "Новое название", lat: 55, lng: 49 });
    await render({ name: "Другая точка", lat: 56, lng: 50 });
    expect(map.setView).not.toHaveBeenCalled();
    expect(map.panTo).not.toHaveBeenCalled();
    expect(map.fitBounds).not.toHaveBeenCalled();
  } finally {
    await act(async () => root.unmount());
  }
});
