import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
const values = {
  name: "Казань",
  description: "",
  startDate: "2026-05-01",
  endDate: "2026-05-02",
  cover: null,
};
beforeEach(async () => {
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
});
describe("demo session flow", () => {
  it("creates and switches trips, then restores selection after remount", async () => {
    await act(async () => travel.login(" Alice "));
    expect(travel.username).toBe("alice");
    expect(travel.trips).toHaveLength(0);
    await act(async () => travel.createTrip(values));
    const firstId = travel.activeId;
    await act(async () => travel.createTrip({ ...values, name: "Москва" }));
    expect(travel.trips).toHaveLength(2);
    expect(travel.activeId).not.toBe(firstId);
    await act(async () => travel.selectTrip(firstId as string));
    await act(async () => root.unmount());
    await mount();
    expect(travel.activeId).toBe(firstId);
    expect(travel.trips).toHaveLength(2);
  });
  it("isolates accounts and keeps trips after logout", async () => {
    await act(async () => travel.login("alice"));
    await act(async () => travel.createTrip(values));
    await act(async () => travel.logout());
    expect(travel.username).toBeNull();
    await act(async () => travel.login("bob"));
    expect(travel.trips).toHaveLength(0);
    await act(async () => travel.logout());
    await act(async () => travel.login("ALICE"));
    expect(travel.trips).toHaveLength(1);
  });
  it("preserves in-memory data when persistence fails", async () => {
    await act(async () => travel.login("alice"));
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    expect(() => travel.createTrip(values)).toThrow();
    expect(travel.trips).toHaveLength(0);
    expect(travel.activeId).toBeNull();
  });
});
