// @vitest-environment node
import { loadEnvConfig } from "@next/env";
import { assert, expect, it } from "vitest";

it("configures the backend on the production origin", () => {
  loadEnvConfig(process.cwd());
  const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;

  assert(
    apiUrl,
    "Set API_URL or NEXT_PUBLIC_API_URL in the environment or .env",
  );
  expect(new URL(apiUrl).origin).toBe(
    "https://hack-kzn-05-vm1-40f58d.vm.prodcontest.com",
  );
});
