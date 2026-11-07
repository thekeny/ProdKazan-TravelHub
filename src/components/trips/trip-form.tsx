"use client";

import { Upload, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { COVER_LIMITS, MATERIAL_TYPES } from "@/configs/consts/materials.const";
import type { TripValues } from "@/configs/types/travel.type";
import { compressCover } from "@/lib/image";
import { validateTrip } from "@/lib/travel-storage";

export function TripForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  onStateChange,
}: {
  initial?: TripValues;
  submitLabel: string;
  onSubmit: (values: TripValues) => void | Promise<void>;
  onCancel?: () => void;
  onStateChange?: (values: TripValues, busy: boolean) => void;
}) {
  const [values, setValues] = useState<TripValues>(() =>
    initial
      ? {
          name: initial.name,
          description: initial.description,
          startDate: initial.startDate,
          endDate: initial.endDate,
          cover: initial.cover,
        }
      : {
          name: "",
          description: "",
          startDate: "",
          endDate: "",
          cover: null,
        },
  );
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);
  const errorId = useId();
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onStateChange?.(values, pending || reading);
  }, [values, pending, reading, onStateChange]);

  function update<K extends keyof TripValues>(key: K, value: TripValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleCover(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (
      !MATERIAL_TYPES.includes(file.type as (typeof MATERIAL_TYPES)[number]) ||
      file.size > COVER_LIMITS.MAX_SOURCE_SIZE
    ) {
      setError("Выберите JPEG, PNG или WebP размером до 12 МБ.");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setReading(true);
    try {
      update("cover", await compressCover(file));
    } catch (coverError) {
      setError(
        coverError instanceof Error
          ? coverError.message
          : "Не удалось обработать обложку.",
      );
    } finally {
      setReading(false);
    }
  }

  return (
    <form
      className="grid gap-5"
      aria-busy={pending || reading}
      onSubmit={async (event) => {
        event.preventDefault();
        if (pendingRef.current || reading) return;
        const validation = validateTrip(values);
        if (validation) {
          setError(validation);
          return;
        }
        pendingRef.current = true;
        setPending(true);
        setError(null);
        try {
          await onSubmit(values);
        } catch (submitError) {
          pendingRef.current = false;
          setPending(false);
          setError(
            submitError instanceof Error
              ? submitError.message
              : "Не удалось сохранить путешествие.",
          );
        }
      }}
    >
      <Field label="Название">
        {(id) => (
          <input
            id={id}
            required
            maxLength={100}
            placeholder="Выходные в Казани"
            className={inputClass}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            value={values.name}
            onChange={(event) => update("name", event.target.value)}
          />
        )}
      </Field>
      <Field label="Описание · необязательно">
        {(id) => (
          <textarea
            id={id}
            maxLength={2000}
            rows={3}
            placeholder="Несколько слов о поездке"
            className={`${inputClass} h-auto resize-y py-3`}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            value={values.description}
            onChange={(event) => update("description", event.target.value)}
          />
        )}
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Дата начала">
          {(id) => (
            <input
              id={id}
              required
              type="date"
              className={inputClass}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              value={values.startDate}
              onChange={(event) => update("startDate", event.target.value)}
            />
          )}
        </Field>
        <Field label="Дата окончания">
          {(id) => (
            <input
              id={id}
              required
              type="date"
              className={inputClass}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              value={values.endDate}
              onChange={(event) => update("endDate", event.target.value)}
            />
          )}
        </Field>
      </div>
      <Field
        label="Обложка · необязательно"
        hint="JPEG, PNG или WebP до 12 МБ. Обложка сжимается автоматически."
      >
        {(id, describedBy) => (
          <div>
            <div className="relative overflow-hidden rounded-lg border border-dashed bg-muted">
              {values.cover && (
                <div
                  role="img"
                  aria-label="Предпросмотр обложки"
                  className="h-40 bg-cover bg-center"
                  style={{ backgroundImage: `url(${values.cover})` }}
                />
              )}
              <label
                htmlFor={id}
                className="flex min-h-20 cursor-pointer flex-col items-center justify-center gap-2 p-4 text-sm outline-none hover:bg-accent focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
              >
                <Upload className="size-5" />
                {reading
                  ? "Обрабатываем…"
                  : values.cover
                    ? "Заменить обложку"
                    : "Выбрать изображение"}
                <input
                  ref={fileRef}
                  id={id}
                  type="file"
                  accept={MATERIAL_TYPES.join(",")}
                  disabled={reading || pending}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  aria-describedby={describedBy}
                  onChange={(event) => {
                    void handleCover(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />
              </label>
            </div>
            {values.cover && (
              <Button
                variant="ghost"
                className="mt-2 h-11"
                type="button"
                onClick={() => {
                  update("cover", null);
                  if (fileRef.current) fileRef.current.value = "";
                }}
              >
                <X />
                Убрать обложку
              </Button>
            )}
          </div>
        )}
      </Field>
      {error && (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex gap-3">
        {onCancel && (
          <Button
            variant="outline"
            className="h-11 flex-1"
            type="button"
            disabled={pending}
            onClick={onCancel}
          >
            Отмена
          </Button>
        )}
        <Button
          type="submit"
          disabled={reading || pending}
          className="h-11 flex-1"
        >
          {reading ? "Обрабатываем…" : pending ? "Сохраняем…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
