import { expect, it } from "vitest";
import { isServerCover, serverCoverUrl } from "@/lib/remote-covers";

it.each([
  "/trips/123/cover/photo.webp",
  "/api/v1/trips/123/cover/photo.webp",
  "/api/backend/trips/123/cover/photo.webp",
  "/gateway/backend/trips/123/cover/photo.webp",
])("normalizes current and legacy covers to the direct backend: %s", (path) => {
  const cover = serverCoverUrl(path);
  expect(cover).toBe("/api/v1/trips/123/cover/photo.webp");
  expect(isServerCover(cover)).toBe(true);
});

it("does not treat unrelated gateway paths or external images as server uploads", () => {
  expect(isServerCover("/api/v1/auth/me")).toBe(false);
  expect(isServerCover("/api/v1-other/trips/123/cover/photo.webp")).toBe(false);
  expect(isServerCover("https://images.example/photo.webp")).toBe(false);
  expect(serverCoverUrl("https://images.example/photo.webp")).toBe(
    "https://images.example/photo.webp",
  );
});
