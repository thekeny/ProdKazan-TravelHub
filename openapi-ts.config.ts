import { defineConfig } from "@hey-api/openapi-ts";
import { loadEnvConfig } from "@next/env";
import { getApiBaseUrl } from "./src/configs/paths/backend.path";

loadEnvConfig(process.cwd());
const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

export default defineConfig({
  input: apiUrl ? `${getApiBaseUrl(apiUrl)}/openapi.json` : "./openapi.json",
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
