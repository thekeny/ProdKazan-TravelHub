"use client";
import { Dialog } from "@base-ui/react/dialog";
import { useId, useRef, useState } from "react";
import { MaterialGrid } from "@/components/materials/material-grid";
import { MaterialUploader } from "@/components/materials/material-uploader";
import { Button } from "@/components/ui/button";
import { DialogPopup } from "@/components/ui/dialog-popup";
import { Field, inputClass } from "@/components/ui/field";
import { EVENT_TYPES } from "@/configs/consts/events.const";
import { MATERIAL_LIMITS } from "@/configs/consts/materials.const";
import type { EventValues, TripEvent } from "@/configs/types/event.type";
import type { Material } from "@/configs/types/material.type";
import type { Trip } from "@/configs/types/travel.type";
import { useDiscardConfirmation } from "@/hooks/use-discard-confirmation";
import { deleteMaterialFiles } from "@/lib/material-storage";
import { validateEvent } from "@/lib/travel-events";

export function EventForm({
  trip,
  event,
  day,
  time,
  initialPointId,
  onClose,
  onSave,
}: {
  trip: Trip;
  event?: TripEvent;
  day: string;
  time?: string;
  initialPointId?: string | null;
  onClose: () => void;
  onSave: (values: EventValues) => void | Promise<void>;
}) {
  const [values, setValues] = useState<EventValues>(
    event ?? {
      title: "",
      type: "walk",
      start: `${day || trip.startDate}T${time ?? "09:00"}`,
      end: "",
      description: "",
      pointId: initialPointId ?? null,
      materials: [],
      bookingUrl: "",
    },
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const pendingRef = useRef(false);
  const uploadingRef = useRef(false);
  const errorId = useId();
  const points = trip.points ?? [];
  const newMaterialIds = useRef<string[]>([]);
  const removedMaterialIds = useRef<string[]>([]);

  function close() {
    if (pendingRef.current || uploadingRef.current) return;
    if (newMaterialIds.current.length)
      void deleteMaterialFiles(newMaterialIds.current);
    newMaterialIds.current = [];
    onClose();
  }

  function setUploadBusy(busy: boolean) {
    uploadingRef.current = busy;
    setUploading(busy);
  }

  function update<K extends keyof EventValues>(key: K, value: EventValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function addMaterial(material: Material) {
    newMaterialIds.current.push(material.id);
    setValues((current) => ({
      ...current,
      materials: [...current.materials, material],
    }));
  }

  function removeMaterial(material: Material) {
    if (newMaterialIds.current.includes(material.id)) {
      newMaterialIds.current = newMaterialIds.current.filter(
        (id) => id !== material.id,
      );
      void deleteMaterialFiles([material.id]);
    } else {
      removedMaterialIds.current.push(material.id);
    }
    setValues((current) => ({
      ...current,
      materials: current.materials.filter((item) => item.id !== material.id),
    }));
  }

  const { requestClose, confirmation } = useDiscardConfirmation(
    values,
    close,
    pending || uploading,
  );
  const describedBy = error ? errorId : undefined;

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) requestClose();
      }}
    >
      {confirmation}
      <Dialog.Portal>
        <Dialog.Backdrop className="dialog-backdrop fixed inset-0 z-[60] bg-overlay/35" />
        <DialogPopup className="dialog-popup fixed inset-0 z-[60] m-auto flex h-fit max-h-[calc(100dvh-1.5rem)] w-[calc(100%-1.5rem)] max-w-3xl flex-col overflow-hidden rounded-xl border bg-background  outline-none">
          <form
            className="flex min-h-0 flex-1 flex-col"
            aria-busy={pending}
            onSubmit={async (e) => {
              e.preventDefault();
              if (pendingRef.current || uploadingRef.current) return;
              const validation = validateEvent(
                values,
                trip,
                new Set(points.map((point) => point.id)),
              );
              if (validation) {
                setError(validation);
                return;
              }
              pendingRef.current = true;
              setPending(true);
              setError(null);
              try {
                await onSave(values);
                newMaterialIds.current = [];
                void deleteMaterialFiles(removedMaterialIds.current);
              } catch (saveError) {
                pendingRef.current = false;
                setPending(false);
                setError(
                  saveError instanceof Error
                    ? saveError.message
                    : "Не удалось сохранить событие.",
                );
              }
            }}
          >
            <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-7">
              <Dialog.Title className="pr-10 text-xl font-semibold">
                {event ? "Редактировать событие" : "Новое событие"}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                Дата и время указаны по местному времени поездки.
              </Dialog.Description>
              <div className="mt-6 grid gap-5">
                <Field label="Название события">
                  {(id) => (
                    <input
                      id={id}
                      required
                      maxLength={120}
                      className={inputClass}
                      aria-invalid={error ? true : undefined}
                      aria-describedby={describedBy}
                      value={values.title}
                      onChange={(e) => update("title", e.target.value)}
                    />
                  )}
                </Field>
                <Field label="Тип события">
                  {(id) => (
                    <select
                      id={id}
                      className={inputClass}
                      aria-invalid={error ? true : undefined}
                      aria-describedby={describedBy}
                      value={values.type}
                      onChange={(e) => {
                        const type = e.target.value;
                        if (Object.hasOwn(EVENT_TYPES, type))
                          update("type", type as EventValues["type"]);
                      }}
                    >
                      {Object.entries(EVENT_TYPES).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  )}
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Начало">
                    {(id) => (
                      <input
                        id={id}
                        required
                        type="datetime-local"
                        min={`${trip.startDate}T00:00`}
                        max={`${trip.endDate}T23:59`}
                        className={inputClass}
                        aria-invalid={error ? true : undefined}
                        aria-describedby={describedBy}
                        value={values.start}
                        onChange={(e) => update("start", e.target.value)}
                      />
                    )}
                  </Field>
                  <Field label="Окончание · необязательно">
                    {(id) => (
                      <input
                        id={id}
                        type="datetime-local"
                        min={values.start}
                        max={`${trip.endDate}T23:59`}
                        className={inputClass}
                        aria-invalid={error ? true : undefined}
                        aria-describedby={describedBy}
                        value={values.end}
                        onChange={(e) => update("end", e.target.value)}
                      />
                    )}
                  </Field>
                </div>
                <Field label="Описание · необязательно">
                  {(id) => (
                    <textarea
                      id={id}
                      maxLength={2000}
                      className={`${inputClass} h-24 py-3`}
                      aria-invalid={error ? true : undefined}
                      aria-describedby={describedBy}
                      value={values.description}
                      onChange={(e) => update("description", e.target.value)}
                    />
                  )}
                </Field>
                <Field label="Точка маршрута · необязательно">
                  {(id) => (
                    <select
                      id={id}
                      className={inputClass}
                      aria-invalid={error ? true : undefined}
                      aria-describedby={describedBy}
                      value={values.pointId ?? ""}
                      onChange={(e) =>
                        update("pointId", e.target.value || null)
                      }
                    >
                      <option value="">Без места на карте</option>
                      {points.map((point) => (
                        <option key={point.id} value={point.id}>
                          {point.name}
                        </option>
                      ))}
                    </select>
                  )}
                </Field>
                <Field
                  label="Ссылка на билет или бронирование · необязательно"
                  hint="Например, ссылка на подтверждение брони или электронный билет."
                >
                  {(id, describedByField) => (
                    <input
                      id={id}
                      type="url"
                      inputMode="url"
                      maxLength={500}
                      placeholder="https://…"
                      className={inputClass}
                      aria-invalid={error ? true : undefined}
                      aria-describedby={
                        [describedBy, describedByField]
                          .filter(Boolean)
                          .join(" ") || undefined
                      }
                      value={values.bookingUrl}
                      onChange={(e) => update("bookingUrl", e.target.value)}
                    />
                  )}
                </Field>
                {points.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Сохраните событие без места, затем добавьте точку в
                    «Маршруте» и привяжите её при редактировании.
                  </p>
                )}
                <section className="grid gap-3" aria-label="Материалы события">
                  <div>
                    <h3 className="text-sm font-medium">Материалы</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Фотографии и изображения билетов хранятся в этом браузере.
                    </p>
                  </div>
                  <MaterialGrid
                    materials={values.materials}
                    onRemove={removeMaterial}
                  />
                  <MaterialUploader
                    remaining={
                      MATERIAL_LIMITS.MAX_PER_EVENT - values.materials.length
                    }
                    defaultKind={values.materials.at(-1)?.kind ?? "photo"}
                    onUploaded={addMaterial}
                    onError={setError}
                    onBusyChange={setUploadBusy}
                  />
                </section>
                {error && (
                  <p
                    id={errorId}
                    role="alert"
                    className="text-sm text-destructive"
                  >
                    {error}
                  </p>
                )}
              </div>
            </div>
            <div className="flex shrink-0 justify-end gap-3 border-t px-5 py-4 sm:px-7">
              <Button
                variant="outline"
                className="h-11"
                type="button"
                disabled={pending || uploading}
                onClick={requestClose}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                className="h-11"
                disabled={pending || uploading}
              >
                {uploading
                  ? "Дождитесь загрузки…"
                  : pending
                    ? "Сохраняем…"
                    : "Сохранить событие"}
              </Button>
            </div>
          </form>
        </DialogPopup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
