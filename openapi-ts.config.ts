import { defineConfig } from "@hey-api/openapi-ts";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());
const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

export default defineConfig({
  input: apiUrl ? `${apiUrl}/openapi.json` : "./openapi.json",
  output: {
    path: "src/api/generated",
  },
  plugins: [
    {
      name: "@hey-api/client-ky",
      runtimeConfigPath: "./src/api/hey-api",
    },
    "@hey-api/typescript",
    "@hey-api/sdk",
  ],
});
