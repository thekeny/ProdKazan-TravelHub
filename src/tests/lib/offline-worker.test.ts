import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";

const source = readFileSync("public/sw.js", "utf8");
const origin = "https://travel.test";

function worker(tiles = "https://maps.test/{z}/{x}/{y}.png") {
  const handlers = new Map<string, (event: unknown) => void>();
  const entries = new Map<string, Response>();
  const key = (request: string | Request | URL) =>
    new URL(
      typeof request === "string"
        ? request
        : request instanceof URL
          ? request.href
          : request.url,
      origin,
    ).href;
  const cache = {
    match: vi.fn(async (request: string | Request) =>
      entries.get(key(request))?.clone(),
    ),
    put: vi.fn(async (request: string | Request, response: Response) => {
      entries.set(key(request), response.clone());
    }),
    keys: async () => [...entries.keys()].map((url) => new Request(url)),
    delete: async (request: Request) => entries.delete(key(request)),
  };
  const network = vi.fn(async (_request: Request): Promise<Response> => {
    throw new TypeError("offline");
  });
  const params = new URLSearchParams({
    routes: JSON.stringify(["/dashboard", "/trips"]),
    assets: "[]",
    tiles,
  });
  runInNewContext(source, {
    URL,
    Request,
    Response,
    fetch: network,
    self: {
      location: { href: `${origin}/sw.js?${params}`, origin },
      addEventListener: (type: string, handler: (event: unknown) => void) =>
        handlers.set(type, handler),
    },
    caches: { open: async () => cache },
  });
  function fetch(url: string, mode = "cors", headers = {}) {
    let result: Promise<Response> | undefined;
    handlers.get("fetch")?.({
      request: { url, mode, method: "GET", headers: new Headers(headers) },
      respondWith: (response: Promise<Response>) => {
        result = response;
      },
    });
    return result;
  }
  return { fetch, entries, network, cache };
}

describe("offline PWA worker", () => {
  it("opens a cached page with day and event deep links without internet", async () => {
    const app = worker();
    app.entries.set(`${origin}/dashboard`, new Response("dashboard shell"));
    const response = await app.fetch(
      `${origin}/dashboard?day=2026-11-07&event=123`,
      "navigate",
    );
    expect(await response?.text()).toBe("dashboard shell");
  });

  it("never substitutes cached HTML for an RSC payload or caches private API responses", () => {
    const app = worker();
    expect(
      app.fetch(`${origin}/dashboard?_rsc=123`, "cors", { RSC: "1" }),
    ).toBeUndefined();
    expect(app.fetch(`${origin}/api/backend/auth/me`)).toBeUndefined();
    expect(app.network).not.toHaveBeenCalled();
  });

  it("stores viewed tiles from an opted-in provider and serves them offline", async () => {
    const app = worker();
    app.network.mockResolvedValueOnce(new Response("tile"));
    const url = "https://maps.test/4/2/3.png";
    expect(await (await app.fetch(url))?.text()).toBe("tile");
    expect(await (await app.fetch(url))?.text()).toBe("tile");
    expect(app.network).toHaveBeenCalledTimes(1);
    expect(app.fetch("https://other.test/4/2/3.png")).toBeUndefined();
  });

  it("never caches OSM public tiles even when explicitly opted in", () => {
    const app = worker("https://tile.openstreetmap.org/{z}/{x}/{y}.png");
    expect(
      app.fetch("https://tile.openstreetmap.org/4/2/3.png"),
    ).toBeUndefined();
    expect(app.cache.put).not.toHaveBeenCalled();
  });

  it("returns a useful error for a page that was never saved", async () => {
    const app = worker();
    expect((await app.fetch(`${origin}/trips`, "navigate"))?.status).toBe(503);
  });
});
