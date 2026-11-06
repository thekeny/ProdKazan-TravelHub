import { Info } from "lucide-react";

export function DemoNotice({ className = "" }: { className?: string }) {
  return (
    <p
      className={`flex items-start gap-2 rounded-lg border border-border/70 bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground ${className}`}
    >
      <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span>
        Демо-режим: аккаунт, поездки и материалы хранятся только в этом браузере
        и не отправляются на сервер. Пароль не проверяется.
      </span>
    </p>
  );
}
