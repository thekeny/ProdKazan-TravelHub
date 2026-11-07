import { useSyncExternalStore } from "react";

const listeners = new Set<() => void>();
let reachable = true;

export function isConnected() {
  return reachable && (typeof navigator === "undefined" || navigator.onLine);
}

export function setConnected(value: boolean) {
  reachable = value;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const online = () => setConnected(true);
  const offline = () => setConnected(false);
  window.addEventListener("online", online);
  window.addEventListener("offline", offline);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("online", online);
    window.removeEventListener("offline", offline);
  };
}

export function useOnline() {
  return useSyncExternalStore(subscribe, isConnected, () => true);
}
