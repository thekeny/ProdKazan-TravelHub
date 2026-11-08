import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "offline.spec.ts",
  workers: 1,
  use: {
    baseURL: "http://localhost:3101",
    serviceWorkers: "allow",
    locale: "ru-RU",
  },
  webServer: {
    cwd: "..",
    command: "node node_modules/next/dist/bin/next start --port 3101",
    url: "http://localhost:3101",
    reuseExistingServer: false,
  },
});
