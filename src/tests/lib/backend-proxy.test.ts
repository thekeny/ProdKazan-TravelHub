import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
