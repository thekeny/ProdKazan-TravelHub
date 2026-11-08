import { act, useState } from "react";
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
it("edits chips in the trip form and saves them with the trip", async () => {
  const save = vi.fn();
  await act(async () =>
    root.render(
      <TripForm initial={trip} submitLabel="Сохранить" onSubmit={save} />,
    ),
  );
  const input = document.querySelector<HTMLInputElement>(
    'input[placeholder="Введите название и нажмите Enter"]',
  );
  await fill(input, "Утренний кофе");
  await act(async () =>
    input?.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Enter",
        bubbles: true,
        cancelable: true,
      }),
    ),
  );
  expect(save).not.toHaveBeenCalled();
  await act(async () =>
    document
      .querySelector("form")
      ?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
  );
  expect(save).toHaveBeenCalledWith(
    expect.objectContaining({ eventTypes: ["Музей", "Утренний кофе"] }),
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
        onAddEventType={vi.fn()}
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
    "Выберите тип события",
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

it("adds a type with Enter, selects it and never submits the event while adding", async () => {
  const save = vi.fn();
  const add = vi.fn();
  function Harness() {
    const [catalog, setCatalog] = useState(trip.eventTypes);
    return (
      <EventForm
        trip={{ ...trip, eventTypes: catalog }}
        day={trip.startDate}
        onClose={vi.fn()}
        onSave={save}
        onAddEventType={async (name) => {
          add(name);
          setCatalog([...(catalog ?? []), name]);
        }}
      />
    );
  }
  await act(async () => root.render(<Harness />));
  await act(async () =>
    Array.from(document.querySelectorAll("button"))
      .find((button) => button.textContent === "Добавить тип")
      ?.click(),
  );
  const input = document.querySelector<HTMLInputElement>(
    'input:not([name]):not([type="file"])',
  );
  await fill(input, "Утренний кофе");
  await act(async () =>
    input?.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Enter",
        bubbles: true,
        cancelable: true,
      }),
    ),
  );
  expect(add).toHaveBeenCalledWith("Утренний кофе");
  expect(save).not.toHaveBeenCalled();
  expect(
    document.querySelector('button[name="customType"]')?.textContent,
  ).toContain("Утренний кофе");
  await fill(
    document.querySelector('input[name="title"]'),
    "Кофе перед музеем",
  );
  await act(async () =>
    document
      .querySelector("form")
      ?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
  );
  expect(save).toHaveBeenCalledWith(
    expect.objectContaining({ customType: "Утренний кофе" }),
  );
});

it("keeps the new type draft after a failed write and prevents closing while it is pending", async () => {
  let rejectAdd: (error: Error) => void = () => {};
  const add = vi.fn(
    () =>
      new Promise<void>((_, reject) => {
        rejectAdd = reject;
      }),
  );
  const close = vi.fn();
  await act(async () =>
    root.render(
      <EventForm
        trip={trip}
        day={trip.startDate}
        onClose={close}
        onSave={vi.fn()}
        onAddEventType={add}
      />,
    ),
  );
  await act(async () =>
    Array.from(document.querySelectorAll("button"))
      .find((button) => button.textContent === "Добавить тип")
      ?.click(),
  );
  const input = document.querySelector<HTMLInputElement>(
    'input:not([name]):not([type="file"])',
  );
  await fill(input, "Музей");
  await act(async () =>
    input?.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Enter",
        bubbles: true,
        cancelable: true,
      }),
    ),
  );
  expect(add).not.toHaveBeenCalled();
  expect(
    Array.from(document.querySelectorAll('[role="alert"]')).some((alert) =>
      alert.textContent?.includes("уже добавлен"),
    ),
  ).toBe(true);
  await fill(input, "Кофе");
  await act(async () =>
    input?.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Enter",
        bubbles: true,
        cancelable: true,
      }),
    ),
  );
  await act(async () =>
    document
      .querySelector<HTMLButtonElement>('[aria-label="Закрыть окно"]')
      ?.click(),
  );
  expect(close).not.toHaveBeenCalled();
  await act(async () => rejectAdd(new Error("Хранилище недоступно")));
  expect(input?.value).toBe("Кофе");
  expect(
    Array.from(document.querySelectorAll('[role="alert"]')).some((alert) =>
      alert.textContent?.includes("Хранилище недоступно"),
    ),
  ).toBe(true);
  expect(
    document.querySelector('button[name="customType"]')?.textContent,
  ).toContain("Выберите тип события");
});
