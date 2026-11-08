const VERSION = "travelhub-app-v1";
const TILES = "travelhub-tiles-v1";
const MAX_TILES = 300;
const config = new URL(self.location.href).searchParams;
const offline = config.get("offline") !== "false";
const routes = JSON.parse(config.get("routes") || "[]");
const assets = JSON.parse(config.get("assets") || "[]");
const tileTemplate = config.get("tiles");
const tilePattern = tileTemplate
  ? new RegExp(
      `^${tileTemplate.replace(/[.*+?^$()|[\]\\]/g, "\\$&").replace(/\{[szxy]\}/g, "[^/]+")}$`,
    )
  : null;

async function save(cache, request, response) {
  try {
    await cache.put(request, response.clone());
  } catch {
    // A full or unavailable cache must not turn successful requests into errors.
  }
}

async function warmShell() {
  const cache = await caches.open(VERSION);
  const dependencies = new Set();
  await Promise.allSettled(
    [...routes, ...new Set(assets)].map(async (path) => {
      const response = await fetch(path);
      if (!response.ok || response.redirected) return;
      await save(cache, path, response);
      if (!routes.includes(path)) return;
      const html = await response.text();
      for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
        const asset = match[1].replaceAll("&amp;", "&");
        if (asset.startsWith("/_next/static/")) dependencies.add(asset);
      }
    }),
  );
  await Promise.allSettled(
    [...dependencies].map(async (path) => {
      const response = await fetch(path);
      if (!response.ok) return;
      await save(cache, path, response);
      if (!path.endsWith(".css")) return;
      const css = await response.text();
      const fonts = [...css.matchAll(/url\(["']?([^\s)"']+)/g)];
      await Promise.allSettled(
        fonts.map(async (match) => {
          const url = new URL(match[1], new URL(path, self.location.origin));
          if (url.origin !== self.location.origin) return;
          const font = await fetch(url);
          if (font.ok) await save(cache, url, font);
        }),
      );
    }),
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      if (offline) await warmShell();
      await self.skipWaiting();
    })(),
  );
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(
            (key) =>
              (key.startsWith("travelhub-app-") ||
                key.startsWith("travelhub-tiles-")) &&
              key !== VERSION &&
              key !== TILES,
          )
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

async function tileResponse(request) {
  const cache = await caches.open(TILES);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok || response.type === "opaque") {
    await save(cache, request, response);
    const keys = await cache.keys();
    await Promise.all(
      keys
        .slice(0, Math.max(0, keys.length - MAX_TILES))
        .map((key) => cache.delete(key)),
    );
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  if (!offline) return;
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  // OSM's public tile servers prohibit offline use. Never cache them, even if
  // someone enables the opt-in intended for a licensed or self-hosted server.
  const osm =
    url.hostname === "openstreetmap.org" ||
    url.hostname.endsWith(".openstreetmap.org");
  if (!osm && tilePattern?.test(url.href)) {
    event.respondWith(tileResponse(request));
    return;
  }
  if (
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/gateway/")
  )
    return;
  // Next normally redirects trailing slashes over the network. Resolve the
  // same shell locally when that redirect is unavailable offline.
  const pathname = url.pathname.replace(/\/+$/, "") || "/";
  if (request.mode === "navigate" && routes.includes(pathname)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(VERSION);
        try {
          const response = await fetch(request);
          if (response.ok && !response.redirected)
            await save(cache, pathname, response);
          return response;
        } catch {
          return (
            (await cache.match(pathname, { ignoreVary: true })) ||
            new Response(
              "Откройте эту страницу при подключении к интернету, чтобы сохранить её для офлайн-просмотра.",
              {
                status: 503,
                headers: { "Content-Type": "text/plain; charset=utf-8" },
              },
            )
          );
        }
      })(),
    );
    return;
  }
  if (
    request.headers.has("RSC") ||
    request.headers.has("Next-Router-State-Tree") ||
    url.searchParams.has("_rsc")
  )
    return;
  const isStatic =
    url.pathname.startsWith("/_next/static/") || assets.includes(url.pathname);
  if (!isStatic) return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(VERSION);
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) await save(cache, request, response);
      return response;
    })(),
  );
});

function readPushPayload(event) {
  if (!event.data) return {};
  try {
    const value = event.data.json();
    return value && typeof value === "object"
      ? value
      : { body: String(value ?? "") };
  } catch {
    return { body: event.data.text() };
  }
}

function notificationUrl(value) {
  try {
    const url = new URL(
      typeof value === "string" ? value : "/dashboard",
      self.location.origin,
    );
    if (
      url.origin === self.location.origin &&
      !url.username &&
      !url.password &&
      ["http:", "https:"].includes(url.protocol)
    )
      return url.href;
  } catch {
    /* Malformed links open the dashboard. */
  }
  return new URL("/dashboard", self.location.origin).href;
}

self.addEventListener("push", (event) => {
  const payload = readPushPayload(event);
  const nested =
    payload.notification && typeof payload.notification === "object"
      ? payload.notification
      : {};
  const title =
    [payload.title, nested.title].find(
      (value) => typeof value === "string" && value,
    ) || "TravelHub";
  const body =
    [payload.body, payload.message, nested.body].find(
      (value) => typeof value === "string",
    ) || "";
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: config.get("icon") || "/brand-icon.png",
      badge: config.get("icon") || "/brand-icon.png",
      data: { url: notificationUrl(payload.url || nested.url) },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = notificationUrl(event.notification.data?.url);
  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      const exact = clients.find((client) => client.url === url);
      if (exact) return exact.focus();
      const existing = clients.find(
        (client) => new URL(client.url).origin === self.location.origin,
      );
      if (existing) {
        try {
          const navigated = await existing.navigate(url);
          if (navigated) return navigated.focus();
        } catch {
          /* A closing tab may no longer accept navigation. */
        }
      }
      return self.clients.openWindow(url);
    })(),
  );
});
