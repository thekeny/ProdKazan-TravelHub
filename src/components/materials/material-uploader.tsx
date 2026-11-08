"use client";

import { LoaderCircle, Upload } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DOCUMENT_ACCEPT,
  MATERIAL_ACCEPT,
} from "@/configs/consts/materials.const";
import type { Material, MaterialKind } from "@/configs/types/material.type";
import { actionToast } from "@/lib/action-toast";
import { deleteMaterialFiles } from "@/lib/material-storage";
import { uploadMaterial } from "@/lib/material-upload";
import { validateMaterialInput } from "@/lib/materials";

export function MaterialUploader({
  remaining,
  kind,
  disabled: externallyDisabled = false,
  onUploaded,
  onError,
  onBusyChange,
  onBatchUploaded,
  compact = false,
  actions,
}: {
  remaining: number;
  kind: MaterialKind;
  disabled?: boolean;
  onUploaded?: (material: Material) => void;
  onBatchUploaded?: (materials: Material[]) => Promise<void>;
  compact?: boolean;
  actions?: React.ReactNode;
  onError: (message: string | null) => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const locked = useRef(false);
  const disabled = externallyDisabled || uploading || remaining <= 0;

  useEffect(() => {
    const input = inputRef.current;
    const restoreFocus = () =>
      buttonRef.current?.focus({ preventScroll: true });
    input?.addEventListener("cancel", restoreFocus);
    return () => input?.removeEventListener("cancel", restoreFocus);
  }, []);

  async function handleFiles(files: FileList | null) {
    if (!files?.length || locked.current || disabled) return;
    onError(null);
    if (files.length > remaining) {
      onError(`Можно добавить не более ${remaining} материалов.`);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    const selected = Array.from(files);
    locked.current = true;
    setUploading(true);
    onBusyChange?.(true);
    try {
      await actionToast(
        async () => {
          const errors: string[] = [];
          let added = 0;
          const batch: Material[] = [];
          for (const file of selected) {
            try {
              const inputError = validateMaterialInput(file, kind);
              if (inputError) throw new Error(inputError);
              const material = await uploadMaterial(file, kind);
              batch.push(material);
              onUploaded?.(material);
              added++;
            } catch (error) {
              errors.push(
                `${file.name}: ${error instanceof Error ? error.message : "Не удалось загрузить файл."}`,
              );
            }
          }
          if (batch.length && onBatchUploaded) {
            try {
              await onBatchUploaded(batch);
            } catch (error) {
              await deleteMaterialFiles(batch.map((material) => material.id));
              throw error;
            }
          }
          if (errors.length) {
            const message = errors.join("\n");
            if (!added) throw new Error(message);
            onError(message);
          }
        },
        "Загружаем файлы…",
        "Загрузка завершена.",
      );
    } catch (error) {
      onError(
        error instanceof Error ? error.message : "Не удалось загрузить файлы.",
      );
    } finally {
      locked.current = false;
      setUploading(false);
      onBusyChange?.(false);
      if (inputRef.current) inputRef.current.value = "";
      requestAnimationFrame(() =>
        buttonRef.current?.focus({ preventScroll: true }),
      );
    }
  }

  return (
    <div
      className={
        compact && actions
          ? "grid grid-cols-2 gap-3 sm:grid-cols-[16rem_16rem]"
          : "grid gap-3"
      }
    >
      <Button
        ref={buttonRef}
        type="button"
        variant={compact ? "default" : "plain"}
        className={
          compact
            ? "h-12 w-full whitespace-normal px-3 leading-snug"
            : `flex min-h-20 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted p-4 text-center text-sm transition-colors outline-none hover:bg-muted-hover focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ${
                disabled ? "pointer-events-none opacity-50" : ""
              }`
        }
        disabled={disabled}
        aria-label={
          kind === "document"
            ? "Загрузить билеты/документы в формате PDF"
            : undefined
        }
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
        ) : (
          <Upload aria-hidden="true" className="size-5" />
        )}
        {uploading
          ? "Сохраняем файлы…"
          : remaining > 0
            ? kind === "document"
              ? compact
                ? "Загрузить PDF"
                : "Добавить PDF"
              : compact
                ? "Загрузить фотографии"
                : "Добавить изображение"
            : "Достигнут лимит материалов"}
      </Button>
      {actions}
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={kind === "document" ? DOCUMENT_ACCEPT : MATERIAL_ACCEPT}
        multiple
        disabled={disabled}
        hidden
        onChange={(event) => {
          buttonRef.current?.focus({ preventScroll: true });
          void handleFiles(event.target.files);
        }}
      />
    </div>
  );
}
