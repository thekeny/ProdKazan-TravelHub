"use client";

import { useEffect } from "react";
import { MAP } from "@/configs/consts/map.const";
import { OFFLINE } from "@/configs/consts/offline.const";
import { images } from "@/configs/paths/images.path";
import { isConnected } from "@/lib/connectivity";

export function PwaRegistration() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      !("serviceWorker" in navigator)
    )
      return;
    const params = new URLSearchParams({
      routes: JSON.stringify(OFFLINE.routes),
      assets: JSON.stringify(Object.values(images)),
      tiles: OFFLINE.cacheTiles ? MAP.tiles : "",
    });
    void navigator.serviceWorker
      .register(`${OFFLINE.worker}?${params}`, {
        scope: "/",
        updateViaCache: "none",
      })
      .catch(() => {
        // Online use must remain available if the browser blocks service workers.
      });
    // Full navigations use cached HTML. RSC responses depend on router state and
    // must never be replaced with HTML or another route's Flight payload.
    const navigate = (event: MouseEvent) => {
      if (
        isConnected() ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const anchor =
        event.target instanceof Element ? event.target.closest("a") : null;
      if (
        !(anchor instanceof HTMLAnchorElement) ||
        anchor.target ||
        anchor.hasAttribute("download")
      )
        return;
      const url = new URL(anchor.href);
      if (
        url.origin !== location.origin ||
        !OFFLINE.routes.some((route) => route === url.pathname)
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      location.assign(url.href);
    };
    document.addEventListener("click", navigate, true);
    return () => document.removeEventListener("click", navigate, true);
  }, []);
  return null;
}
