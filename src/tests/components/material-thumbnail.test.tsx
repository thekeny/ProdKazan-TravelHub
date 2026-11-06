import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MaterialThumbnail } from "@/components/materials/material-thumbnail";
import type { Material } from "@/configs/types/material.type";

vi.mock("@/lib/material-storage", () => ({
  getMaterialFile: vi.fn(async () => null),
}));

const material: Material = {
  id: "missing",
  name: "ticket.png",
  mimeType: "image/png",
  size: 1024,
  kind: "document",
  createdAt: "2026-05-01T09:00:00.000Z",
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

describe("material thumbnail", () => {
  it("does not crash the card when the file is missing", async () => {
    await act(async () =>
      root.render(<MaterialThumbnail material={material} />),
    );
    expect(document.body.textContent).toContain("Изображение недоступно");
  });
});
