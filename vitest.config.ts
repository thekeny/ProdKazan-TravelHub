import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  // Component tests need CSS imports, without Next.js's PostCSS pipeline.
  css: { postcss: { plugins: [] } },
  test: {
    // Fixtures use same-origin API paths regardless of the deployment environment.
    env: { NEXT_PUBLIC_API_URL: "" },
    environment: "jsdom",
    globals: true,
    include: ["src/tests/**/*.{test,spec}.{ts,tsx}"],
  },
});
