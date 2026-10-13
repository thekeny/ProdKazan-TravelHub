import type { CreateClientConfig } from "@/api/generated/client.gen";
import { API, API_URL } from "@/configs/consts/api.const";

export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  baseUrl: API_URL,
  timeout: API.TIMEOUT,
  retry: {
    limit: API.LIMIT,
    methods: API.METHODS,
    statusCodes: API.STATUS_CODES,
  },
});
