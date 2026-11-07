import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import { useDiscardConfirmation } from "@/hooks/use-discard-confirmation";

describe("discard confirmation", () => {
  it("closes clean forms, preserves changed forms until confirmed, and blocks busy forms", async () => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    const close = vi.fn();
    let requestClose = () => {};
    function Probe({ value, busy = false }: { value: string; busy?: boolean }) {
      const guard = useDiscardConfirmation(value, close, busy);
      requestClose = guard.requestClose;
      return guard.confirmation;
    }
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    try {
      await act(async () => root.render(<Probe value="initial" />));
      await act(async () => requestClose());
      expect(close).toHaveBeenCalledTimes(1);
      close.mockClear();
      await act(async () => root.render(<Probe value="changed" busy />));
      await act(async () => requestClose());
      expect(document.querySelector('[role="dialog"]')).toBeNull();
      await act(async () => root.render(<Probe value="changed" />));
      await act(async () => requestClose());
      expect(close).not.toHaveBeenCalled();
      const buttons = Array.from(document.querySelectorAll("button"));
      const discard = buttons.find(
        (button) => button.textContent === "Закрыть без сохранения",
      );
      expect(discard).toBeDefined();
      await act(async () => discard?.click());
      expect(close).toHaveBeenCalledTimes(1);
    } finally {
      await act(async () => root.unmount());
      container.remove();
      vi.unstubAllGlobals();
    }
  });
});
