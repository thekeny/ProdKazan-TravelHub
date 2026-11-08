// @vitest-environment node
import { expect, it } from "vitest";
import { API_BASE } from "@/configs/paths/backend.path";

it("configures the backend on the production origin", () => {
  expect(new URL(API_BASE, "https://travel.example/trips").href).toBe(
    "https://travel.example/api/v1",
  );
});
