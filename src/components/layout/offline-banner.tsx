"use client";

import { Tooltip } from "@base-ui/react/tooltip";
import { useState } from "react";
import { NoNetIcon } from "@/components/ui/no-net-icon";
import { useOnline } from "@/lib/connectivity";

export function OfflineBanner() {
  const online = useOnline();
  const [checking, setChecking] = useState(false);
  async function checkConnection() {
    setChecking(true);
    try {
      const response = await fetch("/", {
        method: "HEAD",
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      });
      if (response.ok) window.location.reload();
    } catch {
      // Keep the saved data visible when the connection is still unavailable.
    } finally {
      setChecking(false);
    }
  }
  if (online) return null;
  return (
    <aside
      aria-live="polite"
      className="flex shrink-0 items-center justify-center bg-offline px-3 text-center text-sm text-offline-foreground"
    >
      <Tooltip.Provider>
        <Tooltip.Root>
          <Tooltip.Trigger
            disabled={checking}
            onClick={() => void checkConnection()}
            aria-label="Вы оффлайн. Доступен только просмотр. Нажмите, чтобы проверить связь"
            className="inline-flex min-h-11 items-center gap-2 rounded-md px-2 outline-none hover:bg-offline-foreground/10 focus-visible:ring-2 focus-visible:ring-offline-foreground disabled:opacity-70"
          >
            <NoNetIcon />
            <span>{checking ? "Проверяем связь…" : "Вы оффлайн"}</span>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner side="bottom" sideOffset={6} className="z-[60]">
              <Tooltip.Popup className="max-w-xs rounded-lg bg-foreground px-3 py-2 text-center text-xs leading-5 text-background">
                Показаны последние сохранённые данные. Изменения пока
                недоступны.
              </Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>
      </Tooltip.Provider>
    </aside>
  );
}
