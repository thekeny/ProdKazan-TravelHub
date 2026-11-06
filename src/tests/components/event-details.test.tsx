import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EventDetails } from "@/components/dashboard/event-details";
import type { TripEvent } from "@/configs/types/event.type";

vi.mock("@/lib/material-storage", () => ({
  getMaterialFile: vi.fn(async () => null),
}));

const event: TripEvent = {
  id: "event",
  title: "Экскурсия по Кремлю",
  type: "tour",
  start: "2026-05-01T10:00",
  end: "2026-05-01T12:30",
  description: "Мечеть Кул-Шариф",
  pointId: null,
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
  bookingUrl: "https://example.com/ticket",
};

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

describe("event details card", () => {
  it("shows type, time, place, description, materials and booking link", async () => {
    await act(async () =>
      root.render(
        <EventDetails
          event={event}
          points={[]}
          onClose={() => {}}
          onEdit={() => {}}
          onDelete={() => {}}
        />,
      ),
    );
    const text = document.body.textContent ?? "";
    expect(text).toContain("Экскурсия");
    expect(text).toContain("Экскурсия по Кремлю");
    expect(text).toContain("1 мая в 10:00");
    expect(text).toContain("Без места на карте");
    expect(text).toContain("Мечеть Кул-Шариф");
    expect(text).toContain("ticket.png");
    expect(text).toContain("Изменить");
    expect(text).toContain("Удалить");
    const link = document.querySelector("a[href='https://example.com/ticket']");
    expect(link).not.toBeNull();
    expect(link?.getAttribute("rel")).toContain("noopener");
  });

  it("explains that an event continues into the next day", async () => {
    await act(async () =>
      root.render(
        <EventDetails
          event={{ ...event, end: "2026-05-02T01:00", materials: [] }}
          points={[]}
          onClose={() => {}}
          onEdit={() => {}}
          onDelete={() => {}}
        />,
      ),
    );
    expect(document.body.textContent).toContain("продолжается до");
    expect(document.body.textContent).toContain("Материалов пока нет");
  });
});
