import * as sdk from "@/api/generated/sdk.gen";
import { OFFLINE } from "@/configs/consts/offline.const";
import { PUSH } from "@/configs/consts/push.const";
import { activeAppServiceWorker } from "@/lib/app-service-worker";
import { isConnected } from "@/lib/connectivity";
import {
  pushDisabled,
  readPushBinding,
  setPushDisabled,
  writePushBinding,
} from "@/lib/push-storage";
import { ApiError, apiId, apiResult } from "@/lib/travel-api";

let queue = Promise.resolve();
const stopped = new Set<string>();

function serialize<T>(operation: () => Promise<T>): Promise<T> {
  const task = queue.then(async () => {
    if (navigator.locks)
      return await navigator.locks.request(PUSH.lock, operation);
    return await operation();
  });
  queue = task.then(
    () => undefined,
    () => undefined,
  );
  return task;
}

export function pushSupported() {
  return (
    typeof window !== "undefined" &&
    window.isSecureContext &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function resumePush(userId: string) {
  stopped.delete(userId);
}

export function pushErrorMessage(error: unknown) {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError")
      return "Разрешите уведомления для сайта в настройках браузера.";
    return "Браузер не смог подключить уведомления. Проверьте настройки сайта и попробуйте снова.";
  }
  if (error instanceof ApiError && error.status === 503)
    return "Уведомления временно недоступны. Попробуйте позже.";
  if (error instanceof ApiError && error.status === 429)
    return "Слишком много запросов. Попробуйте позже.";
  return error instanceof Error
    ? error.message
    : "Не удалось подключить уведомления.";
}

export function applicationServerKey(value: string) {
  try {
    const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
    const bytes = Uint8Array.from(
      atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")),
      (c) => c.charCodeAt(0),
    );
    if (bytes.length !== 65 || bytes[0] !== 4) throw new Error();
    return bytes;
  } catch {
    throw new Error("Сервер вернул некорректный ключ уведомлений.");
  }
}

async function removeServerBinding(id: string) {
  try {
    await apiResult(
      sdk.pushRemoveSubscription({ path: { subscriptionId: apiId(id) } }),
    );
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 404)) throw error;
  }
}

async function unsubscribe(subscription: PushSubscription) {
  if (!(await subscription.unsubscribe()))
    throw new Error(
      "Не удалось отключить подписку в браузере. Попробуйте снова.",
    );
}

async function sync(userId: string, force = false) {
  if (
    stopped.has(userId) ||
    !pushSupported() ||
    Notification.permission !== "granted" ||
    !isConnected()
  )
    return false;
  if (!force && pushDisabled(userId)) return false;
  const worker = await activeAppServiceWorker();
  const { publicKey } = await apiResult(sdk.pushGetPublicKey());
  const key = applicationServerKey(publicKey);
  let subscription = await worker.pushManager.getSubscription();
  let saved = readPushBinding();
  if (subscription) {
    const current = subscription.options.applicationServerKey;
    const sameKey =
      current &&
      new Uint8Array(current).length === key.length &&
      new Uint8Array(current).every((byte, index) => byte === key[index]);
    if (!sameKey || (saved && saved.userId !== userId)) {
      await unsubscribe(subscription);
      if (saved?.userId === userId) await removeServerBinding(saved.id);
      writePushBinding(null);
      saved = null;
      subscription = null;
    }
  }
  for (let attempt = 0; attempt < 2; attempt++) {
    if (stopped.has(userId)) return false;
    subscription ??= await worker.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: key,
    });
    const json = subscription.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth)
      throw new Error("Браузер вернул неполную подписку уведомлений.");
    let id: string;
    try {
      const response = await apiResult(
        sdk.pushPostSubscription({
          body: {
            endpoint: json.endpoint,
            keys: { p256Dh: json.keys.p256dh, auth: json.keys.auth },
          },
        }),
      );
      if (!response.id)
        throw new Error("Сервер не вернул идентификатор подписки.");
      apiId(response.id);
      id = response.id;
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 409)) throw error;
      if (saved?.userId === userId && saved.endpoint === subscription.endpoint)
        id = saved.id;
      else {
        await unsubscribe(subscription);
        subscription = null;
        if (attempt === 0) continue;
        throw new Error(
          "Не удалось восстановить подписку. Попробуйте включить уведомления снова.",
        );
      }
    }
    try {
      writePushBinding({ userId, id, endpoint: json.endpoint });
      setPushDisabled(userId, false);
    } catch {
      await subscription.unsubscribe().catch(() => false);
      await removeServerBinding(id).catch(() => undefined);
      throw new Error(
        "Не удалось сохранить подписку в браузере. Проверьте доступ к хранилищу.",
      );
    }
    return true;
  }
  return false;
}

export function syncPushSubscription(userId: string) {
  return serialize(() => sync(userId));
}

// Invoke from the click handler before awaiting other work (Safari user activation).
export function enablePush(userId: string) {
  if (!pushSupported())
    return Promise.reject(
      new Error("Этот браузер не поддерживает push-уведомления."),
    );
  const permission = Notification.requestPermission();
  return permission.then((value) => {
    if (value !== "granted")
      throw new Error("Разрешите уведомления для сайта в настройках браузера.");
    return serialize(async () => {
      if (!isConnected())
        throw new Error("Для подключения уведомлений нужен интернет.");
      if (!(await sync(userId, true)))
        throw new Error("Не удалось подключить уведомления. Войдите снова.");
    });
  });
}

export function disablePush(userId: string | undefined, logout = false) {
  if (logout && userId) stopped.add(userId);
  return serialize(async () => {
    if (!logout && userId) setPushDisabled(userId, true);
    const worker =
      "serviceWorker" in navigator
        ? await navigator.serviceWorker.getRegistration(OFFLINE.worker)
        : undefined;
    const subscription = await worker?.pushManager.getSubscription();
    if (subscription) await unsubscribe(subscription);
    const saved = readPushBinding();
    if (saved && saved.userId === userId && isConnected())
      await removeServerBinding(saved.id);
    writePushBinding(null);
  });
}

export class PushRateLimitError extends Error {
  constructor(readonly retryAt: number) {
    super("Слишком много запросов. Дождитесь повторной отправки.");
  }
}

export function testPush(userId: string) {
  return serialize(async () => {
    if (!isConnected())
      throw new Error("Для тестового уведомления нужен интернет.");
    const saved = readPushBinding();
    if (stopped.has(userId) || saved?.userId !== userId)
      throw new Error("Сначала подключите уведомления.");
    const result = await sdk.pushPostTestNotification({
      body: { subscriptionId: apiId(saved.id) },
    });
    if (result.response?.status === 429) {
      const delay = Number(result.response.headers.get("Retry-After"));
      throw new PushRateLimitError(
        Date.now() + (Number.isFinite(delay) && delay > 0 ? delay : 60) * 1000,
      );
    }
    try {
      await apiResult(Promise.resolve(result));
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        writePushBinding(null);
        await sync(userId);
        throw new Error(
          "Подписка обновлена. Отправьте тестовое уведомление ещё раз.",
        );
      }
      throw error;
    }
  });
}
