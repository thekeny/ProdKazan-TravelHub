"use client";
import { Upload, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { FormProvider } from "react-hook-form";
import { EventTypeChips } from "@/components/trips/event-type-chips";
import { Button } from "@/components/ui/button";
import { ConfirmDelete } from "@/components/ui/confirm-delete";
import { DateRangeFields } from "@/components/ui/date-range-fields";
import { Field } from "@/components/ui/field";
import { Input, inputClass } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { COVER_LIMITS, MATERIAL_TYPES } from "@/configs/consts/materials.const";
import { TEXT_LIMITS } from "@/configs/consts/validation.const";
import type { TripValues } from "@/configs/types/travel.type";
import { useFormValues } from "@/hooks/use-form-values";
import { actionToast } from "@/lib/action-toast";
import { tripErrors } from "@/lib/form-validation";
import { compressCover } from "@/lib/image";
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
  onStateChange?: (
    values: TripValues,
    busy: boolean,
    typeDraft: string,
  ) => void;
}) {
  const [values, setValues, form] = useFormValues<TripValues>(
    () =>
      initial
        ? {
            name: initial.name,
            description: initial.description,
            startDate: initial.startDate,
            endDate: initial.endDate,
            cover: initial.cover,
            eventTypes: initial.eventTypes ?? [],
          }
        : {
            name: "",
            description: "",
            startDate: "",
            endDate: "",
            cover: null,
            eventTypes: [],
          },
    (values) => tripErrors(values, { initial }),
  );
  const [removeCover, setRemoveCover] = useState(false);
  const [typeDraft, setTypeDraft] = useState("");
  const [removingTypes, setRemovingTypes] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);
  const errorId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    onStateChange?.(values, pending || reading, typeDraft);
  }, [values, pending, reading, typeDraft, onStateChange]);
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
      form.setError("cover", {
        message: "Выберите JPEG, PNG или WebP размером до 12 МБ.",
      });
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setReading(true);
    try {
      update(
        "cover",
        await actionToast(
          () => compressCover(file),
          "Обрабатываем обложку…",
          "Обложка добавлена.",
        ),
      );
      form.clearErrors("cover");
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
    <FormProvider {...form}>
      <ConfirmDelete
        open={removingTypes !== null}
        busy={pending || reading}
        title="Убрать тип события?"
        onClose={() => setRemovingTypes(null)}
        onConfirm={() => {
          if (removingTypes) update("eventTypes", removingTypes);
          setRemovingTypes(null);
        }}
      >
        Тип исчезнет из списка после сохранения путешествия. В существующих
        событиях он сохранится.
      </ConfirmDelete>
      <ConfirmDelete
        open={removeCover}
        title="Убрать обложку?"
        onClose={() => setRemoveCover(false)}
        onConfirm={() => {
          update("cover", null);
          if (fileRef.current) fileRef.current.value = "";
          setRemoveCover(false);
        }}
      >
        Обложка будет удалена после сохранения поездки.
      </ConfirmDelete>
      <form
        noValidate
        className="grid gap-4"
        aria-busy={pending || reading}
        onSubmit={async (event) => {
          event.preventDefault();
          if (!(await form.trigger(undefined, { shouldFocus: true }))) return;
          if (pendingRef.current || reading) return;
          pendingRef.current = true;
          setPending(true);
          setError(null);
          try {
            await actionToast(
              () => onSubmit(values),
              "Сохраняем…",
              "Изменения сохранены.",
            );
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
        <fieldset disabled={pending || reading} className="contents">
          <Field name="name" label="Название">
            {(id) => (
              <Input
                data-field-control
                id={id}
                required
                minLength={TEXT_LIMITS.MIN}
                maxLength={TEXT_LIMITS.NAME}
                placeholder="Выходные в Казани"
                className={inputClass}
                value={values.name}
                onChange={(event) => update("name", event.target.value)}
              />
            )}
          </Field>
          <Field name="description" label="Описание (необязательно)">
            {(id) => (
              <Textarea
                data-field-control
                id={id}
                minLength={TEXT_LIMITS.MIN}
                maxLength={TEXT_LIMITS.DESCRIPTION}
                rows={3}
                placeholder="Несколько слов о поездке"
                className={`${inputClass} h-auto resize-y py-3`}
                value={values.description}
                onChange={(event) => update("description", event.target.value)}
              />
            )}
          </Field>
          <EventTypeChips
            value={values.eventTypes ?? []}
            disabled={pending || reading}
            onDraftChange={setTypeDraft}
            onChange={(names) => {
              if (names.length < (values.eventTypes?.length ?? 0))
                setRemovingTypes(names);
              else update("eventTypes", names);
            }}
          />
          {form.formState.errors.eventTypes && (
            <p role="alert" className="text-xs text-destructive">
              {form.formState.errors.eventTypes.message}
            </p>
          )}
          <DateRangeFields
            start={values.startDate}
            end={values.endDate}
            startName="startDate"
            endName="endDate"
            startLabel="Дата начала"
            endLabel="Дата окончания"
            initialStart={initial?.startDate}
            initialEnd={initial?.endDate}
            disabled={pending || reading}
            onChange={(startDate, endDate) =>
              setValues((current) => ({ ...current, startDate, endDate }))
            }
          />
          <Field
            name="cover"
            label="Обложка (необязательно)"
            hint="JPEG, PNG или WebP до 12 МБ"
          >
            {(id, describedBy) => (
              <div>
                <div className="relative overflow-hidden rounded-lg border border-dashed bg-muted">
                  {values.cover && (
                    <div className="relative h-40">
                      <Image
                        src={values.cover}
                        alt="Предпросмотр обложки"
                        fill
                        unoptimized
                        sizes="100vw"
                        className="object-cover"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="absolute right-2 top-2 z-10 size-11 bg-surface text-foreground"
                        type="button"
                        aria-label="Убрать обложку"
                        onClick={() => setRemoveCover(true)}
                      >
                        <X aria-hidden="true" />
                      </Button>
                    </div>
                  )}
                  <label
                    htmlFor={id}
                    className="flex min-h-20 cursor-pointer flex-col items-center justify-center gap-2 p-4 text-sm outline-none hover:bg-muted-hover focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
                  >
                    <Upload className="size-5" />
                    {reading
                      ? "Обрабатываем…"
                      : values.cover
                        ? "Заменить обложку"
                        : "Выбрать изображение"}
                    <Input
                      data-field-control
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
        </fieldset>
      </form>
    </FormProvider>
  );
}
