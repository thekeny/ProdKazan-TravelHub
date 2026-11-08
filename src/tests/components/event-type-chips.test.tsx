import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { EventTypeChips } from "@/components/trips/event-type-chips";

let root: Root;
let container: HTMLDivElement;

function Form() {
  const [names, setNames] = useState(["Музей", "Кофе"]);
  return <EventTypeChips value={names} onChange={setNames} />;
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
});

it("shows existing tags without an add input and allows removing one", async () => {
  expect(container.querySelector("input")).toBeNull();
  const remove = container.querySelector<HTMLButtonElement>(
    '[aria-label="Убрать тег «Музей»"]',
  );
  expect(remove).not.toBeNull();
  await act(async () => remove?.click());
  expect(container.textContent).not.toContain("Музей");
  expect(container.textContent).toContain("Кофе");
});
