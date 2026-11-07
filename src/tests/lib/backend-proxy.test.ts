import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as backendRoute from "@/app/api/backend/[...path]/route";
import { proxyBackend } from "@/lib/backend-proxy";

const fetchMock = vi.fn<typeof fetch>();
function request(path: string, method = "GET", cookie = "", origin?: string) {
  return new NextRequest(`http://localhost:3000/api/backend/${path}`, {
    method,
    headers: { Cookie: cookie, ...(origin ? { Origin: origin } : {}) },
  });
}
beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_API_URL", "https://backend.example");
  vi.stubEnv("API_URL", "");
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("backend proxy", () => {
  it("follows a trailing-slash redirect on the server with authentication", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(null, {
          status: 307,
          headers: { Location: "https://backend.example/api/v1/trips/" },
        }),
      )
      .mockResolvedValueOnce(new Response("[]"));
    const response = await proxyBackend(
      request("trips", "GET", "travelhub_access=access"),
      ["trips"],
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
    expect(fetchMock.mock.calls[1][0]).toBe(
      "https://backend.example/api/v1/trips/",
    );
    expect(
      new Headers(fetchMock.mock.calls[1][1]?.headers).get("Authorization"),
    ).toBe("Bearer access");
  });
  it("does not forward credentials to an external redirect target", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(null, {
        status: 307,
        headers: { Location: "https://foreign.example/api/v1/trips/" },
      }),
    );
    const response = await proxyBackend(request("trips"), ["trips"]);
    expect(response.status).toBe(307);
    expect(fetchMock).toHaveBeenCalledOnce();
  });
  it("preserves mutation bodies and queries across 307 and stops redirect loops", async () => {
    fetchMock.mockImplementation(
      async () =>
        new Response(null, {
          status: 307,
          headers: { Location: "/api/v1/trips/?page=1" },
        }),
    );
    const body = JSON.stringify({ name: "Trip" });
    const response = await proxyBackend(
      new NextRequest("http://localhost:3000/api/backend/trips?page=1", {
        method: "POST",
        body,
        headers: { "Content-Type": "application/json" },
      }),
      ["trips"],
    );
    expect(response.status).toBe(307);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toBe(
      "https://backend.example/api/v1/trips/?page=1",
    );
    expect(fetchMock.mock.calls[1][1]?.method).toBe("POST");
    expect(
      new TextDecoder().decode(fetchMock.mock.calls[1][1]?.body as ArrayBuffer),
    ).toBe(body);
  });
  it("forwards password changes to the backend with the session and JSON body", async () => {
    const body = JSON.stringify({
      currentPassword: "old-pass",
      newPassword: "new-pass",
    });
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    const response = await backendRoute.PUT(
      new NextRequest("http://localhost:3000/api/backend/auth/me/password", {
        method: "PUT",
        body,
        headers: {
          "Content-Type": "application/json",
          Cookie: "travelhub_access=test-access",
          Origin: "http://localhost:3000",
        },
      }),
      { params: Promise.resolve({ path: ["auth", "me", "password"] }) },
    );
    expect(response.status).toBe(204);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("https://backend.example/api/v1/auth/me/password");
    expect(options?.method).toBe("PUT");
    expect(new Headers(options?.headers).get("Authorization")).toBe(
      "Bearer test-access",
    );
    expect(new Headers(options?.headers).get("Content-Type")).toBe(
      "application/json",
    );
    expect(new TextDecoder().decode(options?.body as ArrayBuffer)).toBe(body);
    expect(response.headers.get("Set-Cookie")).toBeNull();
  });
  it("keeps access and refresh tokens in HttpOnly cookies", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ access_token: "secret-access", token_type: "bearer" }),
        {
          headers: {
            "Content-Type": "application/json",
            "Set-Cookie":
              "refresh_token=secret-refresh; HttpOnly; Path=/api/v1/auth",
          },
        },
      ),
    );
    const response = await proxyBackend(request("auth/login", "POST"), [
      "auth",
      "login",
    ]);
    expect(await response.json()).toEqual({ token_type: "bearer" });
    expect(response.cookies.get("travelhub_access")?.value).toBe(
      "secret-access",
    );
    expect(response.cookies.get("travelhub_refresh")?.value).toBe(
      "secret-refresh",
    );
    expect(response.headers.get("Set-Cookie")).toContain("HttpOnly");
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://backend.example/api/v1/auth/login",
    );
  });
  it("renews once for simultaneous expired requests and retries with the new token", async () => {
    let refreshes = 0;
    fetchMock.mockImplementation(async (url, options) => {
      if (String(url).endsWith("auth/refresh")) {
        refreshes++;
        return new Response(JSON.stringify({ access_token: "renewed" }), {
          headers: { "Set-Cookie": "refresh_token=rotated" },
        });
      }
      const headers = new Headers(options?.headers);
      return headers.get("Authorization") === "Bearer renewed"
        ? new Response(JSON.stringify({ username: "traveler" }))
        : new Response("{}", { status: 401 });
    });
    const cookie =
      "travelhub_access=expired; travelhub_refresh=concurrent-test-refresh";
    const responses = await Promise.all([
      proxyBackend(request("auth/me", "GET", cookie), ["auth", "me"]),
      proxyBackend(request("auth/me", "GET", cookie), ["auth", "me"]),
    ]);
    expect(refreshes).toBe(1);
    for (const response of responses) {
      expect(response.status).toBe(200);
      expect(response.cookies.get("travelhub_access")?.value).toBe("renewed");
    }
  });
  it("rejects cross-origin writes and unknown API paths before contacting the backend", async () => {
    expect(
      (
        await proxyBackend(
          request("trips", "POST", "", "https://foreign.example"),
          ["trips"],
        )
      ).status,
    ).toBe(403);
    expect(
      (await proxyBackend(request("admin/user/all"), ["admin", "user", "all"]))
        .status,
    ).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it.each([
    ["POST", "trips/import"],
    ["GET", "trips/123/export"],
    ["POST", "trips/123/tickets/preview"],
    ["POST", "trips/123/tickets/apply"],
  ])(
    "proxies %s %s with its session and download headers",
    async (method, path) => {
      const download = 'attachment; filename="trip-123.json"';
      fetchMock.mockResolvedValueOnce(
        new Response("{}", { headers: { "Content-Disposition": download } }),
      );
      const response = await proxyBackend(
        request(path, method, "travelhub_access=access"),
        path.split("/"),
      );
      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Disposition")).toBe(download);
      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe(`https://backend.example/api/v1/${path}`);
      expect(new Headers(options?.headers).get("Authorization")).toBe(
        "Bearer access",
      );
    },
  );
  it("clears cookies on logout and masks network failures", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    const logout = await proxyBackend(
      request("auth/logout", "POST", "travelhub_access=access"),
      ["auth", "logout"],
    );
    expect(logout.status).toBe(204);
    expect(logout.cookies.get("travelhub_access")?.value).toBe("");
    fetchMock.mockRejectedValueOnce(new Error("private network details"));
    const failed = await proxyBackend(request("health"), ["health"]);
    expect(failed.status).toBe(502);
    expect(await failed.text()).not.toContain("private network details");
  });
});

it("preserves binary image bytes on upload and authenticated download", async () => {
  expect(backendRoute).toHaveProperty("PUT", expect.any(Function));
  if (!("PUT" in backendRoute) || typeof backendRoute.PUT !== "function")
    throw new Error("The backend route must handle PUT requests");
  const bytes = new Uint8Array([0, 255, 128, 13, 10]);
  fetchMock.mockResolvedValueOnce(new Response("{}"));
  await backendRoute.PUT(
    new NextRequest("http://localhost:3000/api/backend/trips/123/cover", {
      method: "PUT",
      body: bytes,
      headers: {
        "Content-Type": "image/png",
        Cookie: "travelhub_access=secret",
      },
    }),
    { params: Promise.resolve({ path: ["trips", "123", "cover"] }) },
  );
  expect(
    new Uint8Array(fetchMock.mock.calls[0][1]?.body as ArrayBuffer),
  ).toEqual(bytes);
  fetchMock.mockResolvedValueOnce(
    new Response(bytes, { headers: { "Content-Type": "image/png" } }),
  );
  const response = await proxyBackend(
    request("trips/123/cover/photo.png", "GET", "travelhub_access=secret"),
    ["trips", "123", "cover", "photo.png"],
  );
  expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
  expect(response.headers.get("Content-Type")).toBe("image/png");
  expect(
    new Headers(fetchMock.mock.calls[1][1]?.headers).get("Authorization"),
  ).toBe("Bearer secret");
});
