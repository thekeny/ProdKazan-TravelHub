"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { PUSH } from "@/configs/consts/push.const";
import { useOnline } from "@/lib/connectivity";
import {
  disablePush,
  enablePush,
  PushRateLimitError,
  pushErrorMessage,
  pushSupported,
  syncPushSubscription,
  testPush,
} from "@/lib/push";
import { pushDisabled, readPushBinding } from "@/lib/push-storage";
import { useTravel } from "@/providers/travel-provider";

type Status =
  | "checking"
  | "unsupported"
  | "disabled"
  | "blocked"
  | "enabled"
  | "error";
type PushContextValue = {
  status: Status;
  pending: boolean;
  online: boolean;
  error: string | null;
  dismissed: boolean;
  retryAt: number;
  dismiss: () => void;
  enable: () => Promise<void>;
  disable: () => Promise<void>;
  test: () => Promise<void>;
};
const PushContext = createContext<PushContextValue | null>(null);

export function PushProvider({
  children,
  onRequestError,
}: {
  children: React.ReactNode;
  onRequestError: (error: unknown, foreground: boolean) => void;
}) {
  const { user, ready } = useTravel();
  const userId = user?.id ?? user?.username;
  const online = useOnline();
  const [status, setStatus] = useState<Status>("checking");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [retryAt, setRetryAt] = useState(0);
  const busy = useRef(false);
  const reportError = useRef(onRequestError);
  reportError.current = onRequestError;

  const refresh = useCallback(async () => {
    if (!userId || !pushSupported()) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("blocked");
      return;
    }
    const binding = readPushBinding();
    const worker = await navigator.serviceWorker.getRegistration();
    const subscription = await worker?.pushManager.getSubscription();
    setStatus(
      Notification.permission === "granted" &&
        !pushDisabled(userId) &&
        binding?.userId === userId &&
        binding.endpoint === subscription?.endpoint
        ? "enabled"
        : "disabled",
    );
  }, [userId]);

  useEffect(() => {
    if (!userId || !ready) return;
    setError(null);
    setRetryAt(0);
    try {
      setDismissed(
        pushDisabled(userId) ||
          sessionStorage.getItem(`${PUSH.dismissedKey}.${userId}`) === "true",
      );
    } catch {
      setDismissed(false);
    }
    let active = true;
    let restoring = false;
    const restore = async () => {
      if (busy.current || restoring || !active) return;
      restoring = true;
      setPending(true);
      try {
        if (online && pushSupported() && Notification.permission === "granted")
          await syncPushSubscription(userId);
        if (active) {
          await refresh();
          setError(null);
        }
      } catch (reason) {
        if (active) {
          setStatus("error");
          setError(pushErrorMessage(reason));
          reportError.current(reason, false);
        }
      } finally {
        restoring = false;
        if (active) setPending(false);
      }
    };
    void restore();
    const focus = () => {
      if (document.visibilityState === "visible") void restore();
    };
    const storage = () => {
      void refresh().catch(() => setStatus("error"));
    };
    window.addEventListener("focus", focus);
    window.addEventListener("storage", storage);
    return () => {
      active = false;
      window.removeEventListener("focus", focus);
      window.removeEventListener("storage", storage);
    };
  }, [userId, ready, online, refresh]);

  if (!userId || !ready)
    return <PushContext.Provider value={null}>{children}</PushContext.Provider>;

  async function action(operation: () => Promise<unknown>) {
    if (busy.current || !userId) return;
    busy.current = true;
    setPending(true);
    setError(null);
    try {
      // Do not defer operation: permission prompts require the original click.
      await operation();
      await refresh();
    } catch (reason) {
      await refresh().catch(() => setStatus("error"));
      if (reason instanceof PushRateLimitError) setRetryAt(reason.retryAt);
      setError(pushErrorMessage(reason));
      reportError.current(reason, true);
      throw new Error(pushErrorMessage(reason));
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  const value: PushContextValue = {
    status,
    pending,
    online,
    error,
    dismissed,
    retryAt,
    dismiss() {
      setDismissed(true);
      try {
        sessionStorage.setItem(`${PUSH.dismissedKey}.${userId}`, "true");
      } catch {
        /* Dismissal still applies to this page. */
      }
    },
    enable: () => action(() => enablePush(userId)),
    disable: () =>
      action(async () => {
        await disablePush(userId);
        setDismissed(true);
      }),
    test: () => action(() => testPush(userId)),
  };
  return <PushContext.Provider value={value}>{children}</PushContext.Provider>;
}

export function usePush() {
  return useContext(PushContext);
}
