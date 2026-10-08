export const API = {
  URL: process.env.NEXT_PUBLIC_API_URL,
  TIMEOUT: 30_000,
  LIMIT: 2,
  METHODS: ["get", "head", "options"],
  STATUS_CODES: [408, 429, 500, 502, 503, 504],
};

export const API_URL = API.URL;
