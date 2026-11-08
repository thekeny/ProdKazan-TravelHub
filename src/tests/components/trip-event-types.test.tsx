import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { EventForm } from "@/components/dashboard/event-form";
import { TripForm } from "@/components/trips/trip-form";
import type { Trip } from "@/configs/types/travel.type";

vi.mock("@/lib/action-toast", () => ({
  actionToast: (action: () => unknown) => action(),
}));
const trip: Trip = {
  id: "trip",
  name: "Казань",
  description: "",
  startDate: "2026-11-07",
  endDate: "2026-11-08",
  cover: null,
  eventTypes: ["Музей"],
};
let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 10, 7, 12));
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
async function fill(input: HTMLInputElement | null, value: string) {
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set?.call(input, value);
    input?.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
it("keeps existing tags without offering an input to add more", async () => {
  const save = vi.fn();
  await act(async () =>
    root.render(
      <TripForm initial={trip} submitLabel="Сохранить" onSubmit={save} />,
    ),
  );
  expect(
    document.querySelector(
      'input[placeholder="Введите название и нажмите Enter"]',
    ),
  ).toBeNull();
  await act(async () =>
    document
      .querySelector("form")
      ?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
  );
  expect(save).toHaveBeenCalledWith(
    expect.objectContaining({ eventTypes: ["Музей"] }),
  );
});
it("offers one dropdown type from the trip catalog", async () => {
  const save = vi.fn();
  await act(async () =>
    root.render(
      <EventForm
        trip={trip}
        day={trip.startDate}
        onClose={vi.fn()}
        onSave={save}
      />,
    ),
  );
  expect(
    document.querySelector(
      'input[placeholder="Введите название и нажмите Enter"]',
    ),
  ).toBeNull();
  const dropdown = document.querySelector<HTMLButtonElement>(
    'button[name="customType"]',
  );
  expect(dropdown).not.toBeNull();
  await act(async () => dropdown?.click());
  const options = Array.from(
    document.querySelectorAll<HTMLElement>('[role="option"]'),
  );
  expect(options.map((option) => option.textContent)).toEqual([
    "Без тега",
    "Музей",
  ]);
  await act(async () =>
    options.find((option) => option.textContent === "Музей")?.click(),
  );
  await fill(document.querySelector('input[name="title"]'), "Утро в музее");
  await act(async () =>
    document
      .querySelector("form")
      ?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
  );
  expect(save).toHaveBeenCalledWith(
    expect.objectContaining({ customType: "Музей" }),
  );
});
