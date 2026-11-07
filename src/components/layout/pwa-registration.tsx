"use client";

import { useEffect } from "react";
import { OFFLINE } from "@/configs/consts/offline.const";
import { registerAppServiceWorker } from "@/lib/app-service-worker";
import { isConnected } from "@/lib/connectivity";

export function PwaRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    void registerAppServiceWorker().catch(() => {
      // Online use must remain available if the browser blocks service workers.
    });
    if (process.env.NODE_ENV !== "production") return;
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
