"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

export function StatusToast({
  message,
  onClose,
}: {
  message: string | null;
  onClose: () => void;
}) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(() => closeRef.current(), 4500);
    return () => window.clearTimeout(timeout);
  }, [message]);

  if (!message) return null;
  return (
    <output
      aria-live="polite"
      className="fixed top-4 right-4 z-[1200] flex max-w-sm items-start gap-2 rounded-lg border bg-surface p-3 text-sm shadow-lg"
    >
      <span className="min-w-0 flex-1 break-words">{message}</span>
      <Button
        variant="ghost"
        size="icon"
        className="size-8 shrink-0"
        aria-label="Закрыть уведомление"
        onClick={onClose}
      >
        <X />
      </Button>
    </output>
  );
}
