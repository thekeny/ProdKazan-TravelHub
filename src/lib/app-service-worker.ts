import { MAP } from "@/configs/consts/map.const";
import { OFFLINE } from "@/configs/consts/offline.const";
import { PUSH } from "@/configs/consts/push.const";
import { images } from "@/configs/paths/images.path";

let registration: Promise<ServiceWorkerRegistration> | undefined;

export function registerAppServiceWorker() {
  if (registration) return registration;
  const production = process.env.NODE_ENV === "production";
  const params = new URLSearchParams({
    offline: String(production),
    routes: JSON.stringify(OFFLINE.routes),
    assets: JSON.stringify(Object.values(images)),
    tiles: production && OFFLINE.cacheTiles ? MAP.tiles : "",
    icon: images.ICON,
  });
  registration = navigator.serviceWorker
    .register(`${OFFLINE.worker}?${params}`, {
      scope: "/",
      updateViaCache: "none",
    })
    .catch((error: unknown) => {
      registration = undefined;
      throw error;
    });
  return registration;
}

export async function activeAppServiceWorker() {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let cleanup: (() => void) | undefined;
  try {
    return await Promise.race([
      (async () => {
        const registered = await registerAppServiceWorker();
        const installing = registered.installing ?? registered.waiting;
        if (installing && installing.state !== "activated") {
          await new Promise<void>((resolve, reject) => {
            const changed = () => {
              if (installing.state === "activated") resolve();
              else if (installing.state === "redundant")
                reject(
                  new Error(
                    "Не удалось обновить уведомления. Обновите страницу.",
                  ),
                );
            };
            cleanup = () =>
              installing.removeEventListener("statechange", changed);
            installing.addEventListener("statechange", changed);
            changed();
          });
        }
        return navigator.serviceWorker.ready;
      })(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () =>
            reject(
              new Error(
                "Не удалось запустить уведомления. Обновите страницу и попробуйте снова.",
              ),
            ),
          PUSH.workerTimeout,
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
    cleanup?.();
  }
}
