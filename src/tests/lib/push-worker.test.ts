import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";

const source = readFileSync("public/sw.js", "utf8");
const origin = "https://travel.test";
function worker(offline = true) {
  const handlers = new Map<string, (event: unknown) => void>();
  const showNotification = vi.fn(async () => undefined);
  const focus = vi.fn();
  const navigate = vi.fn(async (_url: string) => ({ focus }));
  const clients = [{ url: `${origin}/trips`, focus, navigate }];
  const openWindow = vi.fn();
  const skipWaiting = vi.fn();
  const params = new URLSearchParams({ offline: String(offline) });
  runInNewContext(source, {
    URL,
    Response,
    self: {
      location: { origin, href: `${origin}/sw.js?${params}` },
      addEventListener: (name: string, handler: (event: unknown) => void) =>
        handlers.set(name, handler),
      registration: { showNotification },
      skipWaiting,
      clients: { matchAll: async () => clients, openWindow },
    },
  });
  async function dispatch(name: string, data: object) {
    let task: Promise<unknown> | undefined;
    handlers.get(name)?.({
      ...data,
      waitUntil: (value: Promise<unknown>) => {
        task = value;
      },
    });
    await task;
  }
  return {
    dispatch,
    handlers,
    showNotification,
    clients,
    focus,
    navigate,
    openWindow,
    skipWaiting,
  };
}

describe("push service worker", () => {
  it("shows flat and nested JSON notifications with existing brand assets", async () => {
    const app = worker();
    await app.dispatch("push", {
      data: {
        json: () => ({
          notification: {
            title: "Событие",
            body: "Пора в путь",
            url: "/dashboard?day=2026-11-08&event=123",
          },
        }),
      },
    });
    expect(app.showNotification).toHaveBeenCalledWith("Событие", {
      body: "Пора в путь",
      icon: "/brand-icon.png",
      badge: "/brand-icon.png",
      data: { url: `${origin}/dashboard?day=2026-11-08&event=123` },
    });
    await app.dispatch("push", {
      data: { json: () => ({ title: "Travel", message: "Сообщение" }) },
    });
    expect(app.showNotification).toHaveBeenLastCalledWith(
      "Travel",
      expect.objectContaining({ body: "Сообщение" }),
    );
  });

  it("handles plain text, null, and missing payloads", async () => {
    const app = worker();
    await app.dispatch("push", {
      data: {
        json: () => {
          throw new Error();
        },
        text: () => "Напоминание",
      },
    });
    expect(app.showNotification).toHaveBeenLastCalledWith(
      "TravelHub",
      expect.objectContaining({ body: "Напоминание" }),
    );
    await app.dispatch("push", { data: { json: () => null } });
    await app.dispatch("push", {});
    expect(app.showNotification).toHaveBeenLastCalledWith(
      "TravelHub",
      expect.objectContaining({ body: "" }),
    );
  });

  it.each([
    "https://evil.test/",
    "//evil.test/",
    "javascript:alert(1)",
    "http://[",
  ])("rejects unsafe notification links: %s", async (url) => {
    const app = worker();
    const close = vi.fn();
    await app.dispatch("notificationclick", {
      notification: { close, data: { url } },
    });
    expect(close).toHaveBeenCalledOnce();
    expect(app.navigate).toHaveBeenCalledWith(`${origin}/dashboard`);
  });

  it("focuses an exact tab and preserves deep links when navigating another tab", async () => {
    const app = worker();
    await app.dispatch("notificationclick", {
      notification: { close: vi.fn(), data: { url: "/trips" } },
    });
    expect(app.focus).toHaveBeenCalledOnce();
    expect(app.navigate).not.toHaveBeenCalled();
    const url = "/dashboard?day=2026-11-08&event=456";
    await app.dispatch("notificationclick", {
      notification: { close: vi.fn(), data: { url } },
    });
    expect(app.navigate).toHaveBeenCalledWith(`${origin}${url}`);
    app.clients.length = 0;
    await app.dispatch("notificationclick", {
      notification: { close: vi.fn() },
    });
    expect(app.openWindow).toHaveBeenCalledWith(`${origin}/dashboard`);
  });

  it("activates in development without warming caches or intercepting requests", async () => {
    const app = worker(false);
    await app.dispatch("install", {});
    expect(app.skipWaiting).toHaveBeenCalledOnce();
    const respondWith = vi.fn();
    app.handlers.get("fetch")?.({ respondWith });
    expect(respondWith).not.toHaveBeenCalled();
  });
});
