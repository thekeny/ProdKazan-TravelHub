import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { EventTypeChips } from "@/components/trips/event-type-chips";

let root: Root;
let container: HTMLDivElement;
const submit = vi.fn((event: React.FormEvent) => event.preventDefault());
function Form({
  initial = ["Музей", "Утренний кофе"],
  disabled = false,
}: {
  initial?: string[];
  disabled?: boolean;
}) {
  const [names, setNames] = useState(initial);
  return (
    <form onSubmit={submit}>
      <EventTypeChips value={names} onChange={setNames} disabled={disabled} />
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
it("removes only the selected tag without submitting the form", async () => {
  expect(container.querySelector("input")).toBeNull();
  const remove = container.querySelector<HTMLButtonElement>(
    '[aria-label="Убрать тег «Утренний кофе»"]',
  );
  expect(remove).not.toBeNull();
  await act(async () => remove?.click());
  expect(
    container.querySelector('[aria-label="Убрать тег «Утренний кофе»"]'),
  ).toBeNull();
  expect(
    container.querySelector('[aria-label="Убрать тег «Музей»"]'),
  ).not.toBeNull();
  expect(submit).not.toHaveBeenCalled();
});
it("blocks tag removal while disabled", async () => {
  await act(async () => root.render(<Form disabled />));
  const remove = container.querySelector<HTMLButtonElement>(
    '[aria-label="Убрать тег «Музей»"]',
  );
  expect(remove?.disabled).toBe(true);
  await act(async () => remove?.click());
  expect(container.querySelectorAll('[aria-label^="Убрать тег"]')).toHaveLength(
    2,
  );
});
it("hides the tag section when the catalog is empty", async () => {
  await act(async () => root.render(<Form key="empty" initial={[]} />));
  expect(container.querySelector("form")?.textContent).toBe("");
});
