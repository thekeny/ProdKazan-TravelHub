"use client";

import { LoaderCircle, Upload } from "lucide-react";
import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  MATERIAL_ACCEPT,
  MATERIAL_KINDS,
} from "@/configs/consts/materials.const";
import type { Material, MaterialKind } from "@/configs/types/material.type";
import { uploadMaterial } from "@/lib/material-upload";
import { validateMaterialInput } from "@/lib/materials";

export function MaterialUploader({
  remaining,
  defaultKind = "photo",
  onUploaded,
  onError,
  onBusyChange,
}: {
  remaining: number;
  defaultKind?: MaterialKind;
  onUploaded: (material: Material) => void;
  onError: (message: string | null) => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const [kind, setKind] = useState<MaterialKind>(defaultKind);
  const [uploading, setUploading] = useState(false);
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const disabled = uploading || remaining <= 0;

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    onError(null);
    const selected = Array.from(files).slice(0, remaining);
    setUploading(true);
    onBusyChange?.(true);
    try {
      for (const file of selected) {
        const inputError = validateMaterialInput(file);
        if (inputError) {
          onError(inputError);
          continue;
        }
        try {
          const material = await uploadMaterial(file, kind);
          onUploaded(material);
        } catch (error) {
          onError(
            error instanceof Error
              ? error.message
              : "Не удалось загрузить изображение.",
          );
        }
      }
    } finally {
      setUploading(false);
      onBusyChange?.(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="grid gap-3">
      <fieldset className="grid gap-2">
        <legend className="text-sm font-medium">Куда добавить</legend>
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
          {Object.entries(MATERIAL_KINDS).map(([value, label]) => (
            <Button
              key={value}
              type="button"
              variant="ghost"
              aria-pressed={kind === value}
              className={`h-10 ${kind === value ? "bg-surface shadow-sm" : ""}`}
              onClick={() => setKind(value as MaterialKind)}
            >
              {label}
            </Button>
          ))}
        </div>
      </fieldset>
      <label
        htmlFor={inputId}
        className={`flex min-h-20 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted p-4 text-center text-sm transition-colors outline-none hover:bg-accent focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ${
          disabled ? "pointer-events-none opacity-50" : ""
        }`}
        aria-disabled={disabled}
      >
        {uploading ? (
          <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
        ) : (
          <Upload aria-hidden="true" className="size-5" />
        )}
        {uploading
          ? "Сжимаем и сохраняем…"
          : remaining > 0
            ? "Добавить изображение"
            : "Достигнут лимит материалов"}
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={MATERIAL_ACCEPT}
          multiple
          disabled={disabled}
          className="sr-only"
          aria-describedby={`${inputId}-hint`}
          onChange={(event) => {
            void handleFiles(event.target.files);
          }}
        />
      </label>
      <p id={`${inputId}-hint`} className="text-xs text-muted-foreground">
        JPEG, PNG или WebP до 12 МБ. Изображение сжимается перед сохранением.
        Фото попадут в «Галерею», билеты и брони — в «Билеты и документы».
        {remaining > 0
          ? ` Можно добавить ещё ${remaining}.`
          : " Достигнут лимит материалов."}
      </p>
    </div>
  );
}
