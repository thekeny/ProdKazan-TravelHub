import type { CreateClientConfig } from "@/api/generated/client.gen";
import { API } from "@/configs/consts/api.const";
import { API_BASE } from "@/configs/paths/backend.path";
import { sessionFetch } from "@/lib/api-session";

export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  baseUrl: API_BASE,
  credentials: "include",
  cache: "no-store",
  kyOptions: { fetch: sessionFetch },
  timeout: API.TIMEOUT,
  retry: {
    limit: API.LIMIT,
    methods: API.METHODS,
    statusCodes: API.STATUS_CODES,
  },
});
