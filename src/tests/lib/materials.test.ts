import { describe, expect, it } from "vitest";
import type { Material } from "@/configs/types/material.type";
import {
  validateBookingUrl,
  validateMaterial,
  validateMaterialInput,
  validateMaterials,
} from "@/lib/materials";

function file(type: string, size: number) {
  return new File([new Uint8Array(size)], "photo", { type });
}

const material: Material = {
  id: "material",
  name: "ticket.webp",
  mimeType: "image/webp",
  size: 1024,
  kind: "document",
  createdAt: "2026-05-01T09:00:00.000Z",
};

describe("materials", () => {
  it("limits new filenames while keeping historical metadata readable", () => {
    expect(
      validateMaterialInput(
        new File(["x"], "a".repeat(255), { type: "image/png" }),
      ),
    ).toBeNull();
    expect(
      validateMaterialInput(
        new File(["x"], "a".repeat(256), { type: "image/png" }),
      ),
    ).toBeTruthy();
    expect(
      validateMaterialInput(new File(["x"], " ", { type: "image/png" })),
    ).toBeTruthy();
    expect(validateMaterial({ ...material, name: "a".repeat(256) })).toBeNull();
  });

  it("accepts supported images and rejects other files", () => {
    expect(validateMaterialInput(file("image/png", 100))).toBeNull();
    expect(validateMaterialInput(file("application/pdf", 100))).toBeTruthy();
    expect(
      validateMaterialInput(file("image/jpeg", 13 * 1024 * 1024)),
    ).toBeTruthy();
  });

  it("validates stored material metadata and duplicates", () => {
    expect(validateMaterial(material)).toBeNull();
    expect(
      validateMaterial({ ...material, mimeType: "text/plain" }),
    ).toBeTruthy();
    expect(validateMaterial({ ...material, size: 0 })).toBeTruthy();
    expect(validateMaterials([material, material])).toBeTruthy();
    expect(validateMaterials([material])).toBeNull();
  });

  it("allows only http links for tickets and bookings", () => {
    expect(validateBookingUrl("")).toBeNull();
    expect(validateBookingUrl("https://example.com/booking")).toBeNull();
    expect(validateBookingUrl("javascript:alert(1)")).toBeTruthy();
    expect(validateBookingUrl("not a url")).toBeTruthy();
  });
});
