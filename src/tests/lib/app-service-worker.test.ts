import { afterEach, expect, it, vi } from "vitest";
import { PUSH } from "@/configs/consts/push.const";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

it("shares the PWA registration and disables offline caching in development", async () => {
  vi.resetModules();
  vi.stubEnv("NODE_ENV", "development");
  const register = vi.fn(async () => ({}));
  vi.stubGlobal("navigator", { serviceWorker: { register } });
  const { registerAppServiceWorker } = await import("@/lib/app-service-worker");
  await Promise.all([registerAppServiceWorker(), registerAppServiceWorker()]);
  expect(register).toHaveBeenCalledOnce();
  const [url, options] = register.mock.calls[0] as unknown as [string, object];
  expect(new URL(url, "https://travel.test").searchParams.get("offline")).toBe(
    "false",
  );
  expect(options).toEqual({ scope: "/", updateViaCache: "none" });
});

it("bounds registration and activation waits", async () => {
  vi.resetModules();
  vi.useFakeTimers();
  vi.stubGlobal("navigator", {
    serviceWorker: {
      register: vi.fn(() => new Promise(() => {})),
      ready: new Promise(() => {}),
    },
  });
  const { activeAppServiceWorker } = await import("@/lib/app-service-worker");
  const result = expect(activeAppServiceWorker()).rejects.toThrow(
    "Обновите страницу",
  );
  await vi.advanceTimersByTimeAsync(PUSH.workerTimeout);
  await result;
  expect(vi.getTimerCount()).toBe(0);
});

it("waits for an updated worker to activate instead of subscribing through the old one", async () => {
  vi.resetModules();
  let changed: (() => void) | undefined;
  const installing = {
    state: "installed",
    addEventListener: vi.fn((_type: string, callback: () => void) => {
      changed = callback;
    }),
    removeEventListener: vi.fn(),
  };
  const registered = { installing };
  vi.stubGlobal("navigator", {
    serviceWorker: {
      register: vi.fn(async () => registered),
      ready: Promise.resolve(registered),
    },
  });
  const { activeAppServiceWorker } = await import("@/lib/app-service-worker");
  let resolved = false;
  const task = activeAppServiceWorker().then(() => {
    resolved = true;
  });
  await vi.waitFor(() => expect(changed).toBeDefined());
  expect(resolved).toBe(false);
  installing.state = "activated";
  changed?.();
  await task;
  expect(resolved).toBe(true);
  expect(installing.removeEventListener).toHaveBeenCalledOnce();
});
