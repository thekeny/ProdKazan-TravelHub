"use client";

import { Button } from "@/components/ui/button";
import { actionToast } from "@/lib/action-toast";
import { usePush } from "@/providers/push-provider";

export function PushPrompt() {
  const push = usePush();
  if (
    !push ||
    push.dismissed ||
    !push.online ||
    !["disabled", "error"].includes(push.status)
  )
    return null;
  return (
    <aside
      aria-label="Подключение уведомлений"
      className="shrink-0 border-b bg-surface px-4 py-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm">
          Включите уведомления TravelHub на этом устройстве.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="ghost"
            className="min-h-11"
            disabled={push.pending}
            onClick={push.dismiss}
          >
            Не сейчас
          </Button>
          <Button
            type="button"
            className="min-h-11"
            disabled={push.pending}
            onClick={() => {
              const task = push.enable();
              void actionToast(
                () => task,
                "Подключаем…",
                "Уведомления подключены.",
              ).catch(() => undefined);
            }}
          >
            {push.pending ? "Подключаем…" : "Включить уведомления"}
          </Button>
        </div>
      </div>
      {push.error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {push.error}
        </p>
      )}
    </aside>
  );
}
