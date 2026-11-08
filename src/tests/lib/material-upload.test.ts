import { beforeEach, expect, it, vi } from "vitest";
import { compressMaterial } from "@/lib/image";
import { putMaterialFile } from "@/lib/material-storage";
import { uploadMaterial } from "@/lib/material-upload";

vi.mock("@/lib/material-storage", () => ({
  putMaterialFile: vi.fn(),
  deleteMaterialFiles: vi.fn(),
}));
vi.mock("@/lib/file-storage", () => ({
  putRemoteFile: vi.fn(),
}));
vi.mock("@/lib/image", () => ({ compressMaterial: vi.fn() }));
beforeEach(() => vi.clearAllMocks());

function pdf(content: string) {
  const file = new File([content], "ticket.pdf", { type: "application/pdf" });
  // jsdom's Blob does not implement text().
  vi.spyOn(file, "slice").mockReturnValue({
    text: async () => content.slice(0, 5),
  } as Blob);
  return file;
}

it("stores PDF bytes without image compression", async () => {
  const file = pdf("%PDF-1.7\n%%EOF");
  const material = await uploadMaterial(file, "document");
  expect(material).toMatchObject({
    kind: "document",
    mimeType: "application/pdf",
    size: file.size,
    name: file.name,
  });
  expect(compressMaterial).not.toHaveBeenCalled();
  expect(putMaterialFile).toHaveBeenCalledWith(
    material.id,
    expect.objectContaining({ type: "application/pdf", size: file.size }),
  );
});

it("rejects renamed non-PDF files before writing storage", async () => {
  await expect(uploadMaterial(pdf("not a PDF"), "document")).rejects.toThrow(
    "корректным PDF",
  );
  expect(putMaterialFile).not.toHaveBeenCalled();
});
