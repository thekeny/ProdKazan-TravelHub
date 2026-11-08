import { API } from "@/configs/consts/api.const";
import { API_BASE } from "@/configs/paths/backend.path";

let accessToken: string | undefined;
let generation = 0;
let renewal: Promise<Response> | undefined;

export function clearApiSession() {
  accessToken = undefined;
  generation++;
}

async function readToken(response: Response, expected: number) {
  if (!response.ok || expected !== generation) return;
  const data: unknown = await response.clone().json();
  if (
    expected === generation &&
    typeof data === "object" &&
    data &&
    "access_token" in data &&
    typeof data.access_token === "string"
  )
    accessToken = data.access_token;
}

async function refreshSession() {
  if (!renewal) {
    const expected = generation;
    const send = async () => {
      if (expected !== generation) return new Response(null, { status: 401 });
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        signal: AbortSignal.timeout(API.TIMEOUT),
      });
      await readToken(response, expected);
      if (response.status === 401 && expected === generation) clearApiSession();
      return response;
    };
    renewal = (async (): Promise<Response> => {
      if (typeof navigator !== "undefined" && navigator.locks)
        return await navigator.locks.request("travelhub-session-refresh", send);
      return send();
    })().finally(() => {
      renewal = undefined;
    });
  }
  const response = await renewal;
  if (!response) throw new Error("Session refresh did not complete");
  return response.clone();
}

// Ky supplies the final Request here, including JSON and multipart bytes.
export const sessionFetch: typeof fetch = async (input, init) => {
  const request = new Request(input, init);
  const target = new URL(request.url);
  const backend = new URL(
    API_BASE,
    typeof location === "undefined" ? request.url : location.href,
  );
  const path = target.pathname;
  const basePath = backend.pathname;
  if (target.origin !== backend.origin || !path.startsWith(`${basePath}/`))
    return fetch(request);
  const endpoint = path.slice(basePath.length);
  const publicRequest = [
    "/auth/login",
    "/auth/register",
    "/auth/refresh",
    "/health",
  ].includes(endpoint);
  const expected = generation;
  if (!publicRequest && !accessToken) {
    const refreshed = await refreshSession();
    if (!refreshed.ok) return refreshed;
    if (expected !== generation) return new Response(null, { status: 401 });
  }
  const send = () => {
    const copy = request.clone();
    if (accessToken && !publicRequest)
      copy.headers.set("Authorization", `Bearer ${accessToken}`);
    return fetch(copy);
  };
  const usedToken = accessToken;
  let response = await send();
  if (response.status === 401 && !publicRequest && expected === generation) {
    if (usedToken === accessToken) {
      const refreshed = await refreshSession();
      if (!refreshed.ok) return refreshed;
    }
    if (expected === generation) response = await send();
  }
  if (
    expected === generation &&
    response.ok &&
    (endpoint === "/auth/login" || endpoint === "/auth/refresh")
  ) {
    // A successful login replaces renewals started for the previous session.
    if (endpoint === "/auth/login") generation++;
    await readToken(response, generation);
  }
  if (
    expected === generation &&
    ((response.ok &&
      (endpoint === "/auth/logout" ||
        (endpoint === "/auth/me" && request.method === "DELETE"))) ||
      (response.status === 401 && !publicRequest))
  )
    clearApiSession();
  return response;
};
