"use client";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { images } from "@/configs/paths/images.path";
import type { Material } from "@/configs/types/material.type";
import { actionToast } from "@/lib/action-toast";
import { useDrive } from "@/providers/drive-provider";

export function DrivePhotoExport({ material }: { material: Material }) {
  const drive = useDrive();
  if (!drive?.status?.enabled || material.kind !== "photo") return null;
  const operation = drive.operations.get(material.id);
  const result = operation?.result;
  const connected =
    drive.status.status === "connected" && !drive.status.revocationPending;
  const disabled = drive.pending || !drive.online || !connected;
  const run = (action: () => Promise<unknown>) => {
    void actionToast(
      action,
      "Экспорт фото…",
      "Состояние экспорта обновлено.",
    ).catch(() => undefined);
  };
  return (
    <div className="grid gap-2 border-t p-2 text-sm">
      {!connected && (
        <p className="text-muted-foreground">
          Подключите Google Drive в настройках аккаунта.
        </p>
      )}
      {result?.status === "succeeded" ? (
        <>
          <p className="user-text">Сохранено: {result.name}</p>
          {result.webViewLink?.startsWith("https://") && (
            <a
              href={result.webViewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-strong underline"
            >
              Открыть в Google Drive
            </a>
          )}
          <Button
            variant="ghost"
            disabled={disabled}
            onClick={() => run(() => drive.exportPhoto(material, true))}
          >
            Сохранить ещё одну копию
          </Button>
        </>
      ) : (
        <Button
          variant="outline"
          disabled={disabled}
          onClick={() => run(() => drive.exportPhoto(material))}
        >
          <Image src={images.GOOGLE_DRIVE} alt="" width={20} height={20} />
          {operation ? "Повторить экспорт" : "Сохранить в Google Drive"}
        </Button>
      )}
      {operation?.exportId && result?.status !== "succeeded" && (
        <Button
          variant="ghost"
          disabled={disabled}
          onClick={() => run(() => drive.checkPhoto(material.id))}
        >
          Проверить экспорт
        </Button>
      )}
      {result && result.status !== "succeeded" && (
        <p className="user-text">
          {result.status === "uncertain"
            ? "Результат неизвестен. Проверьте состояние или повторите экспорт."
            : (result.errorReason ?? `Состояние: ${result.status}`)}
        </p>
      )}
    </div>
  );
}
