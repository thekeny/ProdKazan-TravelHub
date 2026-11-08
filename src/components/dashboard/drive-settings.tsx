"use client";
import Image from "next/image";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { images } from "@/configs/paths/images.path";
import { actionToast } from "@/lib/action-toast";
import { useDrive } from "@/providers/drive-provider";

export function DriveSettings({ onBusy }: { onBusy: (busy: boolean) => void }) {
  const drive = useDrive();
  const pending = drive?.pending ?? false;
  useEffect(() => {
    onBusy(pending);
    return () => onBusy(false);
  }, [pending, onBusy]);
  if (!drive) return null;
  const status = drive.status;
  const run = (operation: () => Promise<void>, success: string) => {
    void actionToast(operation, "Google Drive…", success).catch(
      () => undefined,
    );
  };
  return (
    <section
      aria-label="Google Drive"
      className="mt-6 grid gap-3 border-t pt-5"
    >
      <h2 className="flex items-center gap-2 text-base font-medium">
        <Image src={images.GOOGLE_DRIVE} alt="" width={24} height={24} />
        Google Drive
      </h2>
      <p className="text-sm">
        {!status
          ? "Состояние подключения неизвестно"
          : !status.enabled
            ? "Интеграция недоступна"
            : status.revocationPending
              ? "Отключение ещё не завершено"
              : status.status === "connected"
                ? "Подключён"
                : status.status === "reconnect_required"
                  ? "Нужно повторное подключение"
                  : "Не подключён"}
      </p>
      {drive.error && (
        <p role="alert" className="user-text text-sm text-destructive">
          {drive.error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {status?.enabled &&
          !status.revocationPending &&
          status.status !== "connected" && (
            <Button
              type="button"
              disabled={pending || !drive.online}
              onClick={() => run(drive.connect, "Открываем Google…")}
            >
              {status.status === "reconnect_required"
                ? "Переподключить Google Drive"
                : "Подключить Google Drive"}
            </Button>
          )}
        {status?.enabled &&
          (status.status === "connected" || status.revocationPending) && (
            <Button
              type="button"
              variant="outline"
              disabled={pending || !drive.online}
              onClick={() =>
                run(drive.disconnect, "Состояние Google Drive обновлено.")
              }
            >
              {status.revocationPending
                ? "Повторить отключение"
                : "Отключить Google Drive"}
            </Button>
          )}
        <Button
          type="button"
          variant="ghost"
          disabled={pending || !drive.online}
          onClick={() => run(drive.refresh, "Состояние обновлено.")}
        >
          Проверить состояние
        </Button>
      </div>
    </section>
  );
}
