import { type NextRequest, NextResponse } from "next/server";

const ACCESS_COOKIE = "travelhub_access";
const REFRESH_COOKIE = "travelhub_refresh";
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/api/backend",
  secure: process.env.NODE_ENV === "production",
};
// Several SDK reads can encounter expiration together. Share the rotation so
// single-use refresh cookies are not consumed by competing requests.
const renewals = new Map<
  string,
  { expires: number; response: Promise<Response> }
>();
async function renewSession(refresh: string, send: () => Promise<Response>) {
  const now = Date.now();
  for (const [key, value] of renewals)
    if (value.expires < now) renewals.delete(key);
  let renewal = renewals.get(refresh);
  if (!renewal) {
    renewal = { expires: now + 35_000, response: send() };
    renewals.set(refresh, renewal);
  }
  try {
    const response = await renewal.response;
    renewal.expires = Date.now() + 5000;
    if (!response.ok) renewals.delete(refresh);
    return response.clone();
  } catch (error) {
    renewals.delete(refresh);
    throw error;
  }
}

function backendUrl() {
  const url = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;
  if (!url) throw new Error("Backend URL is not configured");
  const parsed = new URL(url);
  return `${parsed.origin}${parsed.pathname.replace(/\/$/, "") || "/api/v1"}`;
}

export async function proxyBackend(request: NextRequest, path: string[]) {
  // Cookie authentication requires rejecting cross-origin mutations.
  if (request.method !== "GET" && request.method !== "HEAD") {
    const origin = request.headers.get("origin");
    if (origin && origin !== request.nextUrl.origin)
      return NextResponse.json(
        { message: "Недопустимый источник запроса." },
        { status: 403 },
      );
  }
  if (
    !/^(auth\/(login|register|refresh|logout|me)|health|trips(?:\/\d+(?:\/(?:(?:points|events|transfers)(?:\/\d+)?|cover(?:\/[a-zA-Z0-9._-]+)?))?)?)$/.test(
      path.join("/"),
    )
  )
    return new NextResponse(null, { status: 404 });

  try {
    const base = backendUrl();
    const route = path.join("/");
    let access = request.cookies.get(ACCESS_COOKIE)?.value;
    let refresh = request.cookies.get(REFRESH_COOKIE)?.value;
    let rotated = false;
    const body = ["GET", "HEAD"].includes(request.method)
      ? undefined
      : await request.arrayBuffer();
    const send = (target: string, method: string, payload?: ArrayBuffer) => {
      const headers = new Headers();
      if (access) headers.set("Authorization", `Bearer ${access}`);
      if (refresh)
        headers.set("Cookie", `refresh_token=${encodeURIComponent(refresh)}`);
      const contentType = request.headers.get("content-type");
      if (contentType) headers.set("Content-Type", contentType);
      return fetch(`${base}/${target}`, {
        method,
        body: payload,
        headers,
        cache: "no-store",
        redirect: "manual",
        signal: AbortSignal.timeout(30_000),
      });
    };
    const readTokens = async (response: Response) => {
      if (!response.ok) return;
      const token: unknown = await response.clone().json();
      if (
        typeof token === "object" &&
        token &&
        "access_token" in token &&
        typeof token.access_token === "string"
      ) {
        access = token.access_token;
        rotated = true;
      }
      for (const cookie of response.headers.getSetCookie()) {
        const match = /^refresh_token=([^;]*)/.exec(cookie);
        if (match) refresh = decodeURIComponent(match[1]);
      }
    };
    let response = await send(
      `${route}${request.nextUrl.search}`,
      request.method,
      body,
    );
    if (
      response.status === 401 &&
      refresh &&
      !["auth/login", "auth/register", "auth/refresh"].includes(route)
    ) {
      const renewal = await renewSession(refresh, () =>
        send("auth/refresh", "POST"),
      );
      await readTokens(renewal);
      if (renewal.ok)
        response = await send(
          `${route}${request.nextUrl.search}`,
          request.method,
          body,
        );
      else if (renewal.status !== 401) response = renewal;
    }
    if (["auth/login", "auth/refresh"].includes(route))
      await readTokens(response);
    const isTokenResponse =
      response.ok && ["auth/login", "auth/refresh"].includes(route);
    const result = new NextResponse(
      response.status === 204
        ? null
        : isTokenResponse
          ? JSON.stringify({ token_type: "bearer" })
          : await response.arrayBuffer(),
      {
        status: response.status,
        headers: {
          "Content-Type":
            response.headers.get("Content-Type") ?? "application/json",
          "Cache-Control": "no-store",
        },
      },
    );
    if (rotated && access) {
      result.cookies.set(ACCESS_COOKIE, access, COOKIE_OPTIONS);
      if (refresh) result.cookies.set(REFRESH_COOKIE, refresh, COOKIE_OPTIONS);
    }
    if (
      ((route === "auth/logout" ||
        (route === "auth/me" && request.method === "DELETE")) &&
        response.ok) ||
      response.status === 401
    ) {
      if (refresh) renewals.delete(refresh);
      result.cookies.set(ACCESS_COOKIE, "", { ...COOKIE_OPTIONS, maxAge: 0 });
      result.cookies.set(REFRESH_COOKIE, "", { ...COOKIE_OPTIONS, maxAge: 0 });
    }
    const retryAfter = response.headers.get("Retry-After");
    if (retryAfter) result.headers.set("Retry-After", retryAfter);
    return result;
  } catch {
    return NextResponse.json(
      { message: "Не удалось связаться с сервером. Попробуйте ещё раз." },
      { status: 502 },
    );
  }
}
