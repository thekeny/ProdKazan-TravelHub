import { act, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import TripMap from "@/components/dashboard/trip-map";
import type { RoutePoint } from "@/configs/types/route.type";

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
  Polyline: () => null,
  TileLayer: () => null,
  Popup: () => null,
  useMap: () => map,
  useMapEvents: () => map,
}));

const point: RoutePoint = {
  id: "point",
  name: "Место",
  description: "",
  lat: 55,
  lng: 49,
};

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

async function setup() {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
  const container = document.createElement("div");
  return { container, root: createRoot(container) };
}

it("keeps the map viewport when placing a point or editing its fields", async () => {
  const { root } = await setup();
  const render = async (place: { lat: number; lng: number } | null) => {
    await act(async () =>
      root.render(
        <TripMap points={[]} legs={[]} onPlace={() => {}} draftPlace={place} />,
      ),
    );
  };
  try {
    await render(null);
    await render({ lat: 55, lng: 49 });
    await render({ lat: 56, lng: 50 });
    expect(map.setView).not.toHaveBeenCalled();
    expect(map.panTo).not.toHaveBeenCalled();
    expect(map.fitBounds).not.toHaveBeenCalled();
  } finally {
    await act(async () => root.unmount());
  }
});

it("fits points into the viewport and pans to the selected one", async () => {
  const { root } = await setup();
  try {
    await act(async () =>
      root.render(<TripMap points={[point]} selectedPointId={point.id} />),
    );
    expect(map.panTo).toHaveBeenCalledWith([55, 49]);
    await act(async () =>
      root.render(<TripMap points={[point]} selectedPointId={null} />),
    );
    expect(map.fitBounds).toHaveBeenCalledWith([[55, 49]], {
      padding: [40, 40],
      maxZoom: 14,
    });
  } finally {
    await act(async () => root.unmount());
  }
});
