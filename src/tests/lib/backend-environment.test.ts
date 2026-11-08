// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

it.each([
  "https://backend.example",
  "https://backend.example/",
  "https://backend.example/api/v1",
  "https://backend.example/api/v1/",
])(
  "sends SDK requests and session refresh to the configured backend: %s",
  async (apiUrl) => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", apiUrl);
    vi.stubGlobal("location", new URL("https://travel.example/trips"));
    vi.resetModules();
    const send = vi
      .fn<typeof fetch>()
      .mockImplementation(async (input) =>
        typeof input === "string"
          ? Response.json({ access_token: "restored" })
          : Response.json({ id: "123", username: "traveler" }),
      );
    vi.stubGlobal("fetch", send);
    const sdk = await import("@/api/generated/sdk.gen");

    const result = await sdk.authGetSelf();

    expect(result.data).toEqual({ id: "123", username: "traveler" });
    expect(send.mock.calls[0]).toEqual([
      "https://backend.example/api/v1/auth/refresh",
      expect.objectContaining({ method: "POST", credentials: "include" }),
    ]);
    const request = send.mock.calls[1][0];
    expect(request).toBeInstanceOf(Request);
    if (!(request instanceof Request))
      throw new Error("Expected an SDK request");
    expect(request.url).toBe("https://backend.example/api/v1/auth/me");
    expect(request.credentials).toBe("include");
    expect(request.headers.get("Authorization")).toBe("Bearer restored");
  },
);
