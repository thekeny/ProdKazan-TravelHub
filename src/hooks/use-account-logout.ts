"use client";

import { useRef, useState } from "react";
import { actionToast } from "@/lib/action-toast";
import { useTravel } from "@/providers/travel-provider";

export function useAccountLogout() {
  const { logout } = useTravel();
  const locked = useRef(false);
  const [pending, setPending] = useState(false);

  async function signOut() {
    if (locked.current) return;
    locked.current = true;
    setPending(true);
    try {
      await actionToast(() => logout(), "Выходим…", "Вы вышли из аккаунта.");
      // AuthGuard redirects after the provider clears the session.
    } catch {
      // actionToast reports the error; keep the account available for retry.
    } finally {
      locked.current = false;
      setPending(false);
    }
  }

  return { signOut, pending };
}
