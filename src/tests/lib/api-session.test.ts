import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { clearApiSession, sessionFetch } from "@/lib/api-session";

const send = vi.fn<typeof fetch>();
const token = (value: string) => Response.json({ access_token: value });
const request = (path: string, method = "GET", body?: BodyInit) =>
  new Request(new URL(`/api/v1${path}`, location.href), {
    method,
    body,
    credentials: "include",
  });
beforeEach(() => {
  clearApiSession();
  send.mockReset();
  vi.stubGlobal("fetch", send);
});
afterEach(() => vi.unstubAllGlobals());

it("restores the session once for concurrent reads and adds the bearer token", async () => {
  send.mockImplementation(async (input) =>
    String(input).endsWith("/auth/refresh")
      ? token("restored")
      : Response.json({}),
  );
  await Promise.all([
    sessionFetch(request("/auth/me")),
    sessionFetch(request("/trips")),
  ]);
  expect(
    send.mock.calls.filter(([input]) => typeof input === "string"),
  ).toHaveLength(1);
  for (const [input] of send.mock.calls)
    if (input instanceof Request) {
      expect(input.headers.get("Authorization")).toBe("Bearer restored");
      expect(input.credentials).toBe("include");
    }
});

it("retries concurrent expired mutations once preserving multipart bodies", async () => {
  send.mockResolvedValueOnce(token("expired"));
  await sessionFetch(request("/auth/login", "POST"));
  const bodies: string[] = [];
  send.mockImplementation(async (input) => {
    if (typeof input === "string") return token("renewed");
    const req = input as Request;
    bodies.push(await req.text());
    return new Response(null, {
      status: req.headers.get("Authorization") === "Bearer renewed" ? 204 : 401,
    });
  });
  const form = new FormData();
  form.set("file", "file-bytes");
  const results = await Promise.all([
    sessionFetch(request("/trips/1/cover", "PUT", form)),
    sessionFetch(request("/trips/2/cover", "PUT", form)),
  ]);
  expect(results.map((r) => r.status)).toEqual([204, 204]);
  expect(bodies).toHaveLength(4);
  expect(bodies.every((body) => body.includes("file-bytes"))).toBe(true);
  expect(
    send.mock.calls.filter(([input]) => typeof input === "string"),
  ).toHaveLength(1);
});

it("never adds a bearer token to another origin", async () => {
  send
    .mockResolvedValueOnce(token("active"))
    .mockResolvedValueOnce(Response.json({}));
  await sessionFetch(request("/auth/login", "POST"));
  await sessionFetch(new Request("https://images.example/api/v1/trips"));
  expect((send.mock.calls[1][0] as Request).headers.has("Authorization")).toBe(
    false,
  );
  expect(send).toHaveBeenCalledTimes(2);
});

it("keeps the active token after failed password verification", async () => {
  send
    .mockResolvedValueOnce(token("active"))
    .mockResolvedValueOnce(new Response(null, { status: 401 }))
    .mockResolvedValueOnce(Response.json({}));
  await sessionFetch(request("/auth/login", "POST"));
  expect((await sessionFetch(request("/auth/login", "POST"))).status).toBe(401);
  await sessionFetch(request("/auth/me"));
  expect((send.mock.calls[2][0] as Request).headers.get("Authorization")).toBe(
    "Bearer active",
  );
});

it("returns refresh failures without retry loops", async () => {
  send.mockResolvedValue(new Response(null, { status: 503 }));
  expect((await sessionFetch(request("/auth/me"))).status).toBe(503);
  expect(send).toHaveBeenCalledOnce();
});

it("passes backend 403 through and clears the access token on logout", async () => {
  send.mockResolvedValueOnce(token("active"));
  await sessionFetch(request("/auth/login", "POST"));
  send.mockResolvedValueOnce(new Response(null, { status: 403 }));
  expect((await sessionFetch(request("/trips"))).status).toBe(403);
  send.mockResolvedValueOnce(new Response(null, { status: 204 }));
  await sessionFetch(request("/auth/logout", "POST"));
  send.mockResolvedValueOnce(new Response(null, { status: 401 }));
  expect((await sessionFetch(request("/auth/me"))).status).toBe(401);
  expect(send.mock.calls.at(-1)?.[0]).toBe("/api/v1/auth/refresh");
});

it("does not restore a session from a refresh that completes after session clearing", async () => {
  let finish: (response: Response) => void = () => undefined;
  send.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const pending = sessionFetch(request("/auth/me"));
  clearApiSession();
  finish(token("stale"));
  await pending;
  send.mockResolvedValueOnce(new Response(null, { status: 401 }));
  expect((await sessionFetch(request("/auth/me"))).status).toBe(401);
});
