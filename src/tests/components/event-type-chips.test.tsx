import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { EventTypeChips } from "@/components/trips/event-type-chips";

let root: Root;
let container: HTMLDivElement;
const submit = vi.fn();
function Form() {
  const [names, setNames] = useState<string[]>([]);
  return (
    <form onSubmit={submit}>
      <EventTypeChips value={names} onChange={setNames} />
    </form>
  );
}
beforeEach(async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => root.render(<Form />));
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});
async function type(value: string) {
  await act(async () => {
    const input = container.querySelector("input");
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set?.call(input, value);
    input?.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
async function key(value: string, isComposing = false) {
  const event = new KeyboardEvent("keydown", {
    key: value,
    bubbles: true,
    cancelable: true,
    isComposing,
  });
  await act(async () => container.querySelector("input")?.dispatchEvent(event));
  return event;
}
it("adds multiword chips only on Enter, prevents submit, and removes chips", async () => {
  await type("Утренний кофе");
  expect((await key(" ")).defaultPrevented).toBe(false);
  expect(
    container.querySelector('[aria-label="Убрать тег «Утренний кофе»"]'),
  ).toBeNull();
  expect((await key("Enter")).defaultPrevented).toBe(true);
  expect(submit).not.toHaveBeenCalled();
  const remove = container.querySelector<HTMLButtonElement>(
    '[aria-label="Убрать тег «Утренний кофе»"]',
  );
  expect(remove).not.toBeNull();
  await act(async () => remove?.click());
  expect(
    container.querySelector('[aria-label="Убрать тег «Утренний кофе»"]'),
  ).toBeNull();
});
it("rejects duplicates ignoring case, ignores blank input and IME confirmation", async () => {
  await key("Enter");
  expect(container.querySelectorAll('[aria-label^="Убрать тег"]')).toHaveLength(
    0,
  );
  await type("Музей");
  await key("Enter", true);
  expect(container.querySelectorAll('[aria-label^="Убрать тег"]')).toHaveLength(
    0,
  );
  await key("Enter");
  await type(" музей ");
  await key("Enter");
  expect(container.querySelectorAll('[aria-label^="Убрать тег"]')).toHaveLength(
    1,
  );
  expect(container.textContent).toContain("Такой тег уже добавлен.");
});
