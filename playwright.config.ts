import { defineConfig } from "@playwright/test";

const port = 3100;
export default defineConfig({
  testDir: "./e2e",
  testIgnore: ["push.spec.ts", "integrations.spec.ts"],
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  expect: {
    timeout: 15000,
    toHaveScreenshot: { stylePath: "./e2e/screenshot.css" },
  },
  snapshotPathTemplate: "{testDir}/snapshots/{arg}{ext}",
  use: {
    channel: "chromium",
    baseURL: `http://localhost:${port}`,
    serviceWorkers: "block",
    locale: "ru-RU",
    timezoneId: "Europe/Moscow",
    trace: "retain-on-failure",
  },
  webServer: {
    command: `node node_modules/next/dist/bin/next dev --port ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: false,
    timeout: 120000,
    env: { NEXT_PUBLIC_API_URL: "", NEXT_TELEMETRY_DISABLED: "1" },
  },
});
