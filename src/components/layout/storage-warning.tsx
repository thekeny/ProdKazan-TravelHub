"use client";

import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTravel } from "@/providers/travel-provider";

export function StorageWarning({ className = "" }: { className?: string }) {
  const { storageWarning, dismissStorageWarning } = useTravel();
  if (!storageWarning) return null;
  return (
    <div
      role="alert"
      className={`flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive ${className}`}
    >
      <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <p className="min-w-0 flex-1 user-text">{storageWarning}</p>
      <Button
        variant="ghost"
        size="icon"
        className="size-8 shrink-0 text-destructive"
        aria-label="Скрыть предупреждение о данных"
        onClick={dismissStorageWarning}
      >
        <X />
      </Button>
    </div>
  );
}
