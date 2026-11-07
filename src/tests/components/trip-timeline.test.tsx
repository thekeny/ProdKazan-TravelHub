import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { TripTimeline } from "@/components/dashboard/trip-timeline";

it("keeps the day scale within the panel and consumes horizontal gestures", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const onScrub = vi.fn();
  try {
    await act(async () =>
      root.render(
        <TripTimeline
          items={[]}
          day="2026-05-01"
          minutes={0}
          position={{
            label: "Начало дня",
            lat: null,
            lng: null,
            pointId: null,
            legId: null,
            item: null,
          }}
          onScrub={onScrub}
          onSelectEvent={vi.fn()}
          onSelectLeg={vi.fn()}
          onEditEvent={vi.fn()}
          onDeleteEvent={vi.fn()}
          onEditLeg={vi.fn()}
          onDeleteLeg={vi.fn()}
        />,
      ),
    );
    const panel = container.querySelector("section");
    const scroll = container.querySelector<HTMLDivElement>(
      "div.overflow-x-auto",
    );
    expect(scroll).toBeNull();
    expect(container.querySelector('[class*="min-w-[1440px]"]')).toBeNull();
    const horizontal = new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      deltaX: 100,
    });
    panel?.querySelector("fieldset")?.dispatchEvent(horizontal);
    expect(horizontal.defaultPrevented).toBe(true);
    expect(onScrub).not.toHaveBeenCalled();
    const vertical = new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      deltaY: 100,
    });
    panel?.dispatchEvent(vertical);
    expect(vertical.defaultPrevented).toBe(false);
    if (scroll) scroll.scrollLeft = 0;
    const edge = new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      deltaX: -100,
    });
    panel?.dispatchEvent(edge);
    expect(edge.defaultPrevented).toBe(true);
  } finally {
    await act(async () => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  }
});
