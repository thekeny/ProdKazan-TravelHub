"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { actionToast } from "@/lib/action-toast";
import { usePush } from "@/providers/push-provider";

export function PushSettings() {
  const push = usePush();
  const [cooldown, setCooldown] = useState(false);
  const retryAt = push?.retryAt ?? 0;
  useEffect(() => {
    const remaining = retryAt - Date.now();
    setCooldown(remaining > 0);
    if (remaining <= 0) return;
    const timer = setTimeout(() => setCooldown(false), remaining);
    return () => clearTimeout(timer);
  }, [retryAt]);
  if (!push) return null;
  const enabled = push.status === "enabled";
  const unavailable =
    push.status === "unsupported" || push.status === "blocked";
  const description = {
    checking: "Проверяем подключение…",
    unsupported:
      "Push недоступны в этом браузере. На iPhone и iPad добавьте приложение на главный экран и откройте его оттуда. Для подключения нужен HTTPS или localhost.",
    blocked:
      "Уведомления запрещены. Разрешите их в настройках сайта в браузере и вернитесь в приложение.",
    enabled: "Уведомления подключены на этом устройстве.",
    disabled: "Подключите уведомления на этом устройстве.",
    error: "Подключение уведомлений требует повторной проверки.",
  }[push.status];
  return (
    <section aria-label="Уведомления" className="mt-6 grid gap-3 border-t pt-4">
      <h3 className="section-label">Уведомления</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
      {!push.online && (
        <p className="text-sm text-muted-foreground">
          Для управления уведомлениями подключитесь к интернету.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {!unavailable && (
          <Button
            type="button"
            className="min-h-11"
            disabled={push.pending || !push.online}
            onClick={() => {
              const task = enabled ? push.disable() : push.enable();
              void actionToast(
                () => task,
                enabled ? "Отключаем…" : "Подключаем…",
                enabled ? "Уведомления отключены." : "Уведомления подключены.",
              ).catch(() => undefined);
            }}
          >
            {push.pending
              ? "Подождите…"
              : enabled
                ? "Отключить уведомления"
                : "Включить уведомления"}
          </Button>
        )}
        {enabled && (
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            disabled={push.pending || !push.online || cooldown}
            onClick={() => {
              void actionToast(
                push.test,
                "Отправляем…",
                "Тестовая отправка принята. Проверьте уведомление на устройстве.",
              ).catch(() => undefined);
            }}
          >
            {cooldown ? "Повторите позже" : "Отправить тестовое"}
          </Button>
        )}
      </div>
      {push.error && (
        <p role="alert" className="text-sm text-destructive">
          {push.error}
        </p>
      )}
    </section>
  );
}
