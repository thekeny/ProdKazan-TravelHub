export function getApiBaseUrl(apiUrl = "") {
  const backendUrl = apiUrl
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/api\/v1$/, "");
  return `${backendUrl}/api/v1`;
}

export const API_BASE = getApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);
