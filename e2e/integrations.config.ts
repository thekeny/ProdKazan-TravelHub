import { defineConfig } from "@playwright/test";
import push from "./push.config";
export default defineConfig({
  ...push,
  testMatch: "integrations.spec.ts",
  use: { ...push.use, reducedMotion: "reduce" },
});
