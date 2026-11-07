import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TripForm } from "@/components/trips/trip-form";
import type { TripValues } from "@/configs/types/travel.type";
import { compressCover } from "@/lib/image";

vi.mock("@/lib/image", () => ({ compressCover: vi.fn() }));

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
  it("accepts a file cover for a server trip and submits the compressed image", async () => {
    const cover = "data:image/webp;base64,dGVzdA==";
    vi.mocked(compressCover).mockResolvedValue(cover);
    const onSubmit = vi.fn();
    await act(async () =>
      root.render(
        <TripForm
          remote
          initial={initial}
          submitLabel="Сохранить"
          onSubmit={onSubmit}
        />,
      ),
    );
    const input = container.querySelector('input[type="file"]');
    expect(input).not.toBeNull();
    Object.defineProperty(input, "files", {
      value: [new File(["image"], "cover.png", { type: "image/png" })],
    });
    await act(async () => {
      input?.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await act(async () => {
      container
        .querySelector("form")
        ?.dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true }),
        );
    });
    expect(onSubmit).toHaveBeenCalledWith({ ...initial, cover });
  });

  it("shows validation beneath the invalid fields and does not submit", async () => {
    const onSubmit = vi.fn();
    await act(async () =>
      root.render(
        <TripForm
          initial={{ ...initial, name: "   ", endDate: "2026-04-01" }}
          submitLabel="Сохранить"
          onSubmit={onSubmit}
        />,
      ),
    );
    const form = container.querySelector("form");
    expect(form?.noValidate).toBe(true);
    await act(async () => {
      form?.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
    });
    expect(onSubmit).not.toHaveBeenCalled();
    const invalid = container.querySelectorAll('input[aria-invalid="true"]');
    expect(invalid).toHaveLength(2);
    for (const input of invalid) {
      const description = document.getElementById(
        input.getAttribute("aria-describedby") ?? "",
      );
      expect(description?.getAttribute("role")).toBe("alert");
      expect(description?.parentElement).toBe(input.parentElement);
    }
  });

  it("keeps entered values and allows retry after a rejected save", async () => {
    const onSubmit = vi
      .fn()
      .mockRejectedValueOnce(new Error("Сервер недоступен"))
      .mockResolvedValueOnce(undefined);
    await act(async () =>
      root.render(
        <TripForm
          initial={initial}
          submitLabel="Сохранить"
          onSubmit={onSubmit}
        />,
      ),
    );
    const form = container.querySelector("form");
    await act(async () => {
      form?.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
    });
    expect(
      container
        .querySelector('button[type="submit"]')
        ?.hasAttribute("disabled"),
    ).toBe(false);
    expect(container.querySelector("input")?.value).toBe(initial.name);
    await act(async () => {
      form?.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
    });
    expect(onSubmit).toHaveBeenCalledTimes(2);
  });

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
