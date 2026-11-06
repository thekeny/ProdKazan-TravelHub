import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TripForm } from "@/components/trips/trip-form";
import type { TripValues } from "@/configs/types/travel.type";

const initial: TripValues = {
  name: "Казань",
  description: "",
  startDate: "2026-05-01",
  endDate: "2026-05-04",
  cover: null,
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
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("trip form", () => {
  it("submits edited values once even on a double click", async () => {
    const onSubmit = vi.fn();
    await act(async () =>
      root.render(
        <TripForm
          initial={initial}
          submitLabel="Сохранить"
          onSubmit={onSubmit}
        />,
      ),
    );
    const form = container.querySelector("form") as HTMLFormElement;
    expect(form).not.toBeNull();
    await act(async () => {
      form.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
      form.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
    });
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(initial);
  });
});
