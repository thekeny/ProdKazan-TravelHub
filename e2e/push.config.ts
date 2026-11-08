import { defineConfig } from "@playwright/test";
import base from "../playwright.config";

const server = Array.isArray(base.webServer)
  ? base.webServer[0]
  : base.webServer;
export default defineConfig({
  ...base,
  testDir: ".",
  testMatch: "push.spec.ts",
  testIgnore: [],
  webServer: {
    ...server,
    cwd: process.cwd(),
    command: "node node_modules/next/dist/bin/next dev --port 3100",
    url: "http://localhost:3100",
    env: {
      NEXT_PUBLIC_API_URL: "",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
});
