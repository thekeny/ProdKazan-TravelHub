import ky, { type KyInstance, type Options } from "ky";
import { API, API_URL } from "@/configs/consts/api.const";

export class APIError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, data: unknown) {
    super(`API request failed with status ${status}`);
    this.name = "APIError";
    this.status = status;
    this.data = data;
  }
}

export const api: KyInstance = ky.create({
  prefix: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: API.TIMEOUT,
  retry: {
    limit: API.LIMIT,
    methods: API.METHODS,
    statusCodes: API.STATUS_CODES,
  },
  hooks: {
    beforeRequest: [
      async () => {
        // заглушка
      },
    ],

    afterResponse: [
      async ({ response }) => {
        if (response.ok) return;

        let data: unknown;

        try {
          data = await response.clone().json();
        } catch {
          data = await response.clone().text();
        }

        throw new APIError(response.status, data);
      },
    ],
  },
});

export async function get<T>(url: string, options?: Options): Promise<T> {
  return api.get(url, options).json<T>();
}

export async function post<TResponse, TBody = unknown>(
  url: string,
  body?: TBody,
  options?: Options,
): Promise<TResponse> {
  return api
    .post(url, {
      ...options,
      json: body,
    })
    .json<TResponse>();
}

export async function put<TResponse, TBody = unknown>(
  url: string,
  body?: TBody,
  options?: Options,
): Promise<TResponse> {
  return api
    .put(url, {
      ...options,
      json: body,
    })
    .json<TResponse>();
}

export async function patch<TResponse, TBody = unknown>(
  url: string,
  body?: TBody,
  options?: Options,
): Promise<TResponse> {
  return api
    .patch(url, {
      ...options,
      json: body,
    })
    .json<TResponse>();
}

export async function del<TResponse = void>(
  url: string,
  options?: Options,
): Promise<TResponse> {
  const response = await api.delete(url, options);

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return response.json<TResponse>();
}
