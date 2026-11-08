import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { TripSettings } from "@/components/trips/trip-settings";

const actions = vi.hoisted(() => ({ deleteTrip: vi.fn(), saveTrip: vi.fn() }));
vi.mock("@/providers/travel-provider", () => ({
  useTravel: () => ({
    ...actions,
    username: "traveler",
    loadCollaborators: async () => ({ owner: { username: "traveler" } }),
  }),
}));
vi.mock("@/lib/action-toast", () => ({
  actionToast: (action: () => unknown) => action(),
}));
let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 10, 8));
  vi.resetAllMocks();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it("requires confirmation, preserves settings on failure and allows one retry", async () => {
  const close = vi.fn();
  let rejectDelete: (error: Error) => void = () => {};
  actions.deleteTrip.mockImplementationOnce(
    () =>
      new Promise<void>((_, reject) => {
        rejectDelete = reject;
      }),
  );
  await act(async () =>
    root.render(
      <TripSettings
        trip={{
          id: "trip",
          name: "Казань",
          description: "",
          startDate: "2026-11-08",
          endDate: "2026-11-10",
          cover: null,
        }}
        onClose={close}
      />,
    ),
  );
  const button = (text: string) =>
    Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(
      (item) => item.textContent === text,
    );
  await act(async () => button("Удалить путешествие")?.click());
  expect(actions.deleteTrip).not.toHaveBeenCalled();
  await act(async () => button("Удалить")?.click());
  expect(actions.deleteTrip).toHaveBeenCalledTimes(1);
  expect(button("Удаляем…")?.disabled).toBe(true);
  await act(async () =>
    document
      .querySelector<HTMLButtonElement>('[aria-label="Закрыть окно"]')
      ?.click(),
  );
  expect(close).not.toHaveBeenCalled();
  await act(async () => rejectDelete(new Error("Попробуйте ещё раз")));
  expect(close).not.toHaveBeenCalled();
  expect(button("Удалить")?.disabled).toBe(false);
  await act(async () => button("Удалить")?.click());
  expect(actions.deleteTrip).toHaveBeenCalledTimes(2);
  expect(close).toHaveBeenCalledTimes(1);
});
