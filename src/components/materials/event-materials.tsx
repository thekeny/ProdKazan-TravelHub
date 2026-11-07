"use client";

import { Tabs } from "@base-ui/react/tabs";
import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { MaterialGrid } from "@/components/materials/material-grid";
import { MaterialUploader } from "@/components/materials/material-uploader";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  MATERIAL_LIMITS,
  MATERIAL_TABS,
} from "@/configs/consts/materials.const";
import { TEXT_LIMITS } from "@/configs/consts/validation.const";
import type { Material, MaterialKind } from "@/configs/types/material.type";

export function EventMaterials({
  materials,
  bookingUrl,
  error,
  disabled,
  onBookingChange,
  onUploaded,
  onRemove,
  onBusyChange,
}: {
  materials: Material[];
  bookingUrl: string;
  error?: string;
  disabled: boolean;
  onBookingChange: (url: string) => void;
  onUploaded: (material: Material) => void;
  onRemove: (material: Material) => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const [kind, setKind] = useState<MaterialKind>("photo");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { formState } = useFormContext();
  const bookingError = formState.errors.bookingUrl;
  useEffect(() => {
    if (bookingError) setKind("document");
  }, [bookingError]);
  return (
    <section className="grid gap-3" aria-label="Материалы события">
      <Tabs.Root
        value={kind}
        onValueChange={(value) => {
          if (value === "photo" || value === "document") {
            setKind(value);
            setUploadError(null);
          }
        }}
      >
        <Tabs.List
          aria-label="Категории материалов"
          className="mb-3 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1"
        >
          {MATERIAL_TABS.map(({ value, label }) => (
            <Tabs.Tab
              key={value}
              value={value}
              disabled={disabled}
              className="min-h-11 rounded-md px-3 text-sm font-medium outline-none transition-colors data-active:bg-surface data-active:text-primary-strong focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              {label}
            </Tabs.Tab>
          ))}
        </Tabs.List>
        {MATERIAL_TABS.map(({ value }) => (
          <Tabs.Panel
            key={value}
            value={value}
            className="grid gap-3 outline-none"
          >
            {value === "document" && (
              <Field
                name="bookingUrl"
                label="Ссылка на билет или бронирование · необязательно"
              >
                {(id) => (
                  <Input
                    data-field-control
                    id={id}
                    type="url"
                    inputMode="url"
                    maxLength={TEXT_LIMITS.URL}
                    placeholder="https://…"
                    value={bookingUrl}
                    disabled={disabled}
                    onChange={(e) => onBookingChange(e.target.value)}
                  />
                )}
              </Field>
            )}
            <MaterialUploader
              kind={value}
              remaining={MATERIAL_LIMITS.MAX_PER_EVENT - materials.length}
              disabled={disabled}
              onUploaded={onUploaded}
              onError={setUploadError}
              onBusyChange={onBusyChange}
            />
            <MaterialGrid
              materials={materials.filter(
                (material) => material.kind === value,
              )}
              onRemove={onRemove}
              emptyLabel={
                value === "photo"
                  ? "Фотографий пока нет"
                  : "Документов пока нет"
              }
            />
          </Tabs.Panel>
        ))}
      </Tabs.Root>
      <p className="text-xs text-muted-foreground">
        Файлы хранятся только в этом браузере.
      </p>
      {(uploadError || error) && (
        <p
          role="alert"
          className="user-text whitespace-pre-line text-sm text-destructive"
        >
          {uploadError || error}
        </p>
      )}
    </section>
  );
}
