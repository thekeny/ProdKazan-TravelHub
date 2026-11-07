import type { CreateClientConfig } from "@/api/generated/client.gen";
import { API } from "@/configs/consts/api.const";

export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  baseUrl: "/api/backend",
  credentials: "same-origin",
  timeout: API.TIMEOUT,
  retry: {
    limit: API.LIMIT,
    methods: API.METHODS,
    statusCodes: API.STATUS_CODES,
  },
});
