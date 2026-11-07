import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as sdk from "@/api/generated/sdk.gen";
import { activeAppServiceWorker } from "@/lib/app-service-worker";
import { setConnected } from "@/lib/connectivity";
import {
  applicationServerKey,
  disablePush,
  enablePush,
  PushRateLimitError,
  resumePush,
  syncPushSubscription,
  testPush,
} from "@/lib/push";
import {
  pushDisabled,
  readPushBinding,
  writePushBinding,
} from "@/lib/push-storage";

vi.mock("@/api/generated/sdk.gen", () => ({
  pushGetPublicKey: vi.fn(),
  pushPostSubscription: vi.fn(),
  pushRemoveSubscription: vi.fn(),
  pushPostTestNotification: vi.fn(),
}));
vi.mock("@/lib/app-service-worker", () => ({
  activeAppServiceWorker: vi.fn(),
}));

const userId = "traveler";
const id = "9223372036854775806";
const bytes = Uint8Array.from({ length: 65 }, (_, i) => (i === 0 ? 4 : i));
const key = btoa(String.fromCharCode(...bytes))
  .replaceAll("+", "-")
  .replaceAll("/", "_")
  .replace(/=+$/, "");
const success = <T>(data: T) => ({
  data,
  error: undefined,
  response: new Response("{}"),
});
const failure = (status: number) => ({
  data: undefined,
  error: {},
  response: new Response("{}", { status }),
});
let current: ReturnType<typeof subscription> | null;
function subscription(endpoint = "https://push.test/device") {
  return {
    endpoint,
    options: { applicationServerKey: bytes.buffer },
    toJSON: () => ({
      endpoint,
      keys: { p256dh: "browser-key", auth: "auth-key" },
    }),
    unsubscribe: vi.fn(async () => {
      current = null;
      return true;
    }),
  };
}
const worker = {
  pushManager: {
    getSubscription: vi.fn(async () => current),
    subscribe: vi.fn(async () => {
      current = subscription();
      return current;
    }),
  },
};
const requestPermission = vi.fn(async () => "granted");
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  setConnected(true);
  current = null;
  resumePush(userId);
  vi.stubGlobal("isSecureContext", true);
  vi.stubGlobal("PushManager", class {});
  vi.stubGlobal("Notification", { permission: "granted", requestPermission });
  vi.stubGlobal("navigator", {
    onLine: true,
    serviceWorker: { getRegistration: vi.fn(async () => worker) },
  });
  vi.mocked(activeAppServiceWorker).mockResolvedValue(
    worker as unknown as ServiceWorkerRegistration,
  );
  vi.mocked(sdk.pushGetPublicKey).mockResolvedValue(
    success({ publicKey: key }),
  );
  vi.mocked(sdk.pushPostSubscription).mockResolvedValue(success({ id }));
  vi.mocked(sdk.pushRemoveSubscription).mockResolvedValue({
    data: undefined,
    error: undefined,
    response: new Response(null, { status: 204 }),
  });
  vi.mocked(sdk.pushPostTestNotification).mockResolvedValue({
    data: undefined,
    error: undefined,
    response: new Response(null, { status: 202 }),
  });
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("push subscription lifecycle", () => {
  it("maps browser keys to the SDK and keeps an int64 ID exact", async () => {
    await syncPushSubscription(userId);
    expect(sdk.pushPostSubscription).toHaveBeenCalledWith({
      body: {
        endpoint: "https://push.test/device",
        keys: { p256Dh: "browser-key", auth: "auth-key" },
      },
    });
    expect(readPushBinding()).toEqual({
      userId,
      id,
      endpoint: "https://push.test/device",
    });
    await testPush(userId);
    expect(sdk.pushPostTestNotification).toHaveBeenCalledWith({
      body: { subscriptionId: id },
    });
  });

  it("reuses a known subscription on conflict without duplicate browser subscriptions", async () => {
    await syncPushSubscription(userId);
    vi.mocked(sdk.pushPostSubscription).mockResolvedValueOnce(failure(409));
    await syncPushSubscription(userId);
    expect(worker.pushManager.subscribe).toHaveBeenCalledTimes(1);
    expect(readPushBinding()?.id).toBe(id);
  });

  it("recovers an unknown conflict once, then reports failure without looping", async () => {
    vi.mocked(sdk.pushPostSubscription).mockResolvedValue(failure(409));
    await expect(syncPushSubscription(userId)).rejects.toThrow(
      "восстановить подписку",
    );
    expect(sdk.pushPostSubscription).toHaveBeenCalledTimes(2);
    expect(current).toBeNull();
    expect(readPushBinding()).toBeNull();
  });

  it("replaces subscriptions for an outdated VAPID key", async () => {
    await syncPushSubscription(userId);
    const old = current;
    if (!old) throw new Error("missing subscription");
    old.options.applicationServerKey = new Uint8Array(65).buffer;
    await syncPushSubscription(userId);
    expect(old.unsubscribe).toHaveBeenCalledOnce();
    expect(sdk.pushRemoveSubscription).toHaveBeenCalledWith({
      path: { subscriptionId: id },
    });
    expect(worker.pushManager.subscribe).toHaveBeenCalledTimes(2);
  });

  it("rolls back server and browser subscriptions if persistence fails", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    await expect(syncPushSubscription(userId)).rejects.toThrow(
      "сохранить подписку",
    );
    expect(current).toBeNull();
    expect(sdk.pushRemoveSubscription).toHaveBeenCalledWith({
      path: { subscriptionId: id },
    });
  });

  it("does not ask permission in the background and respects explicit disabling", async () => {
    await syncPushSubscription(userId);
    await disablePush(userId);
    expect(pushDisabled(userId)).toBe(true);
    expect(current).toBeNull();
    await syncPushSubscription(userId);
    expect(worker.pushManager.subscribe).toHaveBeenCalledTimes(1);
    expect(requestPermission).not.toHaveBeenCalled();
    await enablePush(userId);
    expect(requestPermission).toHaveBeenCalledOnce();
    expect(pushDisabled(userId)).toBe(false);
  });

  it("waits for in-flight registration on logout and prevents queued restoration", async () => {
    let finish:
      | ((value: ReturnType<typeof success<{ id: string }>>) => void)
      | undefined;
    vi.mocked(sdk.pushPostSubscription).mockImplementationOnce(
      () =>
        new Promise<ReturnType<typeof success<{ id: string }>>>((resolve) => {
          finish = resolve;
        }),
    );
    const connecting = syncPushSubscription(userId);
    await vi.waitFor(() => expect(finish).toBeDefined());
    const leaving = disablePush(userId, true);
    const queued = syncPushSubscription(userId);
    finish?.(success({ id }));
    await Promise.all([connecting, leaving, queued]);
    expect(current).toBeNull();
    expect(readPushBinding()).toBeNull();
    expect(sdk.pushPostSubscription).toHaveBeenCalledOnce();
  });

  it("unsubscribes even when server removal fails", async () => {
    await syncPushSubscription(userId);
    vi.mocked(sdk.pushRemoveSubscription).mockResolvedValueOnce(failure(500));
    await expect(disablePush(userId, true)).rejects.toThrow();
    expect(current).toBeNull();
  });

  it("clears delivery before reading corrupted storage on logout", async () => {
    await syncPushSubscription(userId);
    localStorage.setItem("travelhub.push", "invalid json");
    await expect(disablePush(userId, true)).rejects.toThrow();
    expect(current).toBeNull();
  });

  it("clears delivery on a confirmed 401 before the account is known", async () => {
    await syncPushSubscription(userId);
    await disablePush(undefined, true);
    expect(current).toBeNull();
    expect(readPushBinding()).toBeNull();
    expect(sdk.pushRemoveSubscription).not.toHaveBeenCalled();
  });

  it("honors Retry-After and restores a missing server subscription", async () => {
    await syncPushSubscription(userId);
    vi.mocked(sdk.pushPostTestNotification).mockResolvedValueOnce({
      data: undefined,
      error: {},
      response: new Response("{}", {
        status: 429,
        headers: { "Retry-After": "120" },
      }),
    });
    try {
      await testPush(userId);
      throw new Error("expected rate limit");
    } catch (error) {
      expect(error).toBeInstanceOf(PushRateLimitError);
      if (error instanceof PushRateLimitError)
        expect(error.retryAt).toBeGreaterThan(Date.now() + 119_000);
    }
    vi.mocked(sdk.pushPostTestNotification).mockResolvedValueOnce(failure(404));
    await expect(testPush(userId)).rejects.toThrow("Подписка обновлена");
    expect(sdk.pushPostSubscription).toHaveBeenCalledTimes(2);
  });

  it("isolates accounts and ignores offline background sync", async () => {
    current = subscription();
    const old = current;
    writePushBinding({ userId: "another", id, endpoint: current.endpoint });
    await syncPushSubscription(userId);
    expect(old.unsubscribe).toHaveBeenCalledOnce();
    expect(readPushBinding()?.userId).toBe(userId);
    setConnected(false);
    await syncPushSubscription(userId);
    expect(sdk.pushPostSubscription).toHaveBeenCalledOnce();
  });

  it("requests permission synchronously and reports denied permission", async () => {
    requestPermission.mockResolvedValueOnce("denied");
    const task = enablePush(userId);
    expect(requestPermission).toHaveBeenCalledOnce();
    await expect(task).rejects.toThrow("Разрешите уведомления");
    expect(sdk.pushPostSubscription).not.toHaveBeenCalled();
  });

  it("validates VAPID format before subscribing", () => {
    expect(applicationServerKey(key)).toEqual(bytes);
    expect(() => applicationServerKey("invalid")).toThrow("некорректный ключ");
  });
});
