import { act, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { MaterialPreview } from "@/components/materials/material-preview";

it("closes the material dialog with Escape and returns focus to its opener", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  function Harness() {
    const ref = useRef<HTMLButtonElement>(null);
    const [open, setOpen] = useState(false);
    return (
      <>
        <button ref={ref} type="button" onClick={() => setOpen(true)}>
          Open
        </button>
        {open && (
          <MaterialPreview
            returnFocus={ref}
            onClose={() => setOpen(false)}
            url="data:image/png;base64,iVBORw0KGgo="
            material={{
              id: "image",
              name: "photo.png",
              mimeType: "image/png",
              size: 10,
              kind: "photo",
              createdAt: "2026-11-07T09:00:00Z",
            }}
          />
        )}
      </>
    );
  }
  try {
    await act(async () => root.render(<Harness />));
    const opener = container.querySelector("button");
    await act(async () => {
      opener?.focus();
      opener?.click();
    });
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    expect(
      document
        .querySelector('[role="dialog"]')
        ?.contains(document.activeElement),
    ).toBe(true);
    await act(async () => {
      document.activeElement?.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 30));
    });
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(opener);
  } finally {
    await act(async () => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  }
});
