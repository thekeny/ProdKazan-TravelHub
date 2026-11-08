import type { CreateClientConfig } from "@/api/generated/client.gen";
import { API } from "@/configs/consts/api.const";
import { GATEWAY } from "@/configs/paths/gateway.path";

export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  baseUrl: GATEWAY.backend,
  credentials: "same-origin",
  timeout: API.TIMEOUT,
  retry: {
    limit: API.LIMIT,
    methods: API.METHODS,
    statusCodes: API.STATUS_CODES,
  },
});
