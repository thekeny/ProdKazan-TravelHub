import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DocumentVisibilityToggle } from "@/components/materials/document-visibility-toggle";
import { MaterialGrid } from "@/components/materials/material-grid";
import type { Material } from "@/configs/types/material.type";
import { useDocumentVisibility } from "@/hooks/use-document-visibility";

vi.mock("@/hooks/use-material-urls", () => ({
  useMaterialUrls: (materials: readonly Material[]) =>
    Object.fromEntries(
      materials.map((material) => [
        material.id,
        "data:image/png;base64,iVBORw0KGgo=",
      ]),
    ),
}));

const materials: Material[] = [
  {
    id: "ticket",
    name: "ticket.png",
    kind: "document",
    mimeType: "image/png",
    size: 10,
    createdAt: "2026-11-08T09:00:00Z",
  },
  {
    id: "booking",
    name: "booking.png",
    kind: "document",
    mimeType: "image/png",
    size: 10,
    createdAt: "2026-11-08T09:00:00Z",
  },
  {
    id: "photo",
    name: "photo.png",
    kind: "photo",
    mimeType: "image/png",
    size: 10,
    createdAt: "2026-11-08T09:00:00Z",
  },
];

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
  vi.unstubAllGlobals();
});

function hidden(name: string) {
  return container
    .querySelector(`img[alt="${name}"]`)
    ?.classList.contains("blur-xl");
}
async function click(label: string, scope: ParentNode = container) {
  const button = [...scope.querySelectorAll("button")].find(
    (item) =>
      item.getAttribute("aria-label") === label || item.textContent === label,
  );
  expect(button, label).toBeDefined();
  await act(async () => button?.click());
}

describe("document privacy", () => {
  it("opens only the selected preview without revealing its thumbnail", async () => {
    await act(async () => root.render(<MaterialGrid materials={materials} />));
    expect(hidden("ticket.png")).toBe(true);
    expect(hidden("booking.png")).toBe(true);
    expect(hidden("photo.png")).toBe(false);
    await click("Открыть материал «ticket.png»");
    expect(hidden("ticket.png")).toBe(true);
    expect(hidden("booking.png")).toBe(true);
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog?.querySelectorAll("img")).toHaveLength(1);
    expect(dialog?.querySelector("img")?.alt).toBe("ticket.png");
    expect(dialog?.querySelector("img")?.classList.contains("blur-xl")).toBe(
      false,
    );
    await click("Закрыть", document);
    expect(hidden("ticket.png")).toBe(true);
    await click("Показать документ «ticket.png»");
    expect(hidden("ticket.png")).toBe(false);
    await click("Скрыть документ «ticket.png»");
    expect(hidden("ticket.png")).toBe(true);
  });

  it("shows and hides every document across event groups without opening previews", async () => {
    function Harness() {
      const visibility = useDocumentVisibility(materials);
      return (
        <>
          <DocumentVisibilityToggle visibility={visibility} />
          <MaterialGrid
            materials={materials.slice(0, 1)}
            documentVisibility={visibility}
          />
          <MaterialGrid
            materials={materials.slice(1)}
            documentVisibility={visibility}
          />
        </>
      );
    }
    await act(async () => root.render(<Harness />));
    await click("Показать документ «ticket.png»");
    expect(hidden("ticket.png")).toBe(false);
    expect(hidden("booking.png")).toBe(true);
    await click("Показать все");
    expect(hidden("ticket.png")).toBe(false);
    expect(hidden("booking.png")).toBe(false);
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    await click("Скрыть все");
    expect(hidden("ticket.png")).toBe(true);
    expect(hidden("booking.png")).toBe(true);
    expect(hidden("photo.png")).toBe(false);
  });

  it("offers no document controls for a photo-only grid", async () => {
    await act(async () =>
      root.render(<MaterialGrid materials={materials.slice(2)} />),
    );
    expect(container.textContent).not.toContain("Показать все");
    expect(container.querySelector("[aria-pressed]")).toBeNull();
  });
});
