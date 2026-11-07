import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { ConfirmDelete } from "@/components/ui/confirm-delete";

it("requires confirmation and blocks repeated deletion and closing during the request", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  let finish: (() => void) | undefined;
  const confirm = vi.fn(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  const close = vi.fn();
  try {
    await act(async () =>
      root.render(
        <ConfirmDelete
          open
          title="Удалить материал?"
          onClose={close}
          onConfirm={confirm}
        >
          Файл будет удалён.
        </ConfirmDelete>,
      ),
    );
    expect(confirm).not.toHaveBeenCalled();
    const buttons = Array.from(document.querySelectorAll("button"));
    const remove = buttons.find((button) => button.textContent === "Удалить");
    await act(async () => {
      remove?.click();
      remove?.click();
    });
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(remove?.disabled).toBe(true);
    await act(async () =>
      buttons.find((button) => button.textContent === "Отмена")?.click(),
    );
    expect(close).not.toHaveBeenCalled();
    await act(async () => {
      finish?.();
    });
    expect(remove?.disabled).toBe(false);
  } finally {
    await act(async () => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  }
});
