"use client";

import { useRef, useState } from "react";
import { actionToast } from "@/lib/action-toast";
import { useTravel } from "@/providers/travel-provider";

export function useTripDeletion(tripId: string, onDeleted?: () => void) {
  const { deleteTrip } = useTravel();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const locked = useRef(false);

  async function remove() {
    if (locked.current) return;
    locked.current = true;
    setPending(true);
    try {
      await actionToast(
        () => deleteTrip(tripId),
        "Удаляем путешествие…",
        "Путешествие удалено.",
      );
      setOpen(false);
      onDeleted?.();
    } catch {
      // Leave the confirmation open so the user can retry after the toast.
    } finally {
      locked.current = false;
      setPending(false);
    }
  }

  return {
    open,
    pending,
    remove,
    request: () => setOpen(true),
    close: () => {
      if (!locked.current) setOpen(false);
    },
  };
}
