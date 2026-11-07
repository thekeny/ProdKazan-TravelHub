import { defineConfig } from "@hey-api/openapi-ts";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

export default defineConfig({
  input: process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/openapi.json`
    : "./openapi.json",
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
