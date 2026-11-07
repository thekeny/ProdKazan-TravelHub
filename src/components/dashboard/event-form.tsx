"use client";
import { Dialog } from "@base-ui/react/dialog";
import { useId, useRef, useState } from "react";
import { FormProvider } from "react-hook-form";
import { EventTypeField } from "@/components/dashboard/event-type-field";
import { EventMaterials } from "@/components/materials/event-materials";
import { Button } from "@/components/ui/button";
import { DialogPopup } from "@/components/ui/dialog-popup";
import { Field } from "@/components/ui/field";
import { Input, inputClass } from "@/components/ui/input";
import { TextSelect } from "@/components/ui/text-select";
import { Textarea } from "@/components/ui/textarea";
import { TEXT_LIMITS } from "@/configs/consts/validation.const";
import type { EventValues, TripEvent } from "@/configs/types/event.type";
import type { Material } from "@/configs/types/material.type";
import type { Trip } from "@/configs/types/travel.type";
import { useDiscardConfirmation } from "@/hooks/use-discard-confirmation";
import { useFormValues } from "@/hooks/use-form-values";
import { actionToast } from "@/lib/action-toast";
import { eventErrors } from "@/lib/form-validation";
import { dateInputBounds } from "@/lib/input-validation";
import { deleteMaterialFiles } from "@/lib/material-storage";

export function EventForm({
  trip,
  event,
  day,
  time,
  initialPointId,
  onClose,
  onSave,
  onAddEventType,
}: {
  trip: Trip;
  event?: TripEvent;
  day: string;
  time?: string;
  initialPointId?: string | null;
  onClose: () => void;
  onSave: (values: EventValues) => void | Promise<void>;
  onAddEventType: (name: string) => void | Promise<void>;
}) {
  const [values, setValues, form] = useFormValues<EventValues>(
    event
      ? event
      : {
          title: "",
          type: "other",
          customType: null,
          start: `${day || trip.startDate}T${time ?? "09:00"}`,
          end: "",
          description: "",
          pointId: initialPointId ?? null,
          materials: [],
          bookingUrl: "",
        },
    (values) =>
      eventErrors(values, trip, trip.points ?? [], { initial: event }),
  );
  const startBounds = dateInputBounds(event?.start, new Date(), trip);
  const endBounds = dateInputBounds(event?.end, new Date(), trip);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [typeDraft, setTypeDraft] = useState("");
  const [addingType, setAddingType] = useState(false);
  const addingTypeRef = useRef(false);
  const pendingRef = useRef(false);
  const uploadingRef = useRef(false);
  const errorId = useId();
  const points = trip.points ?? [];
  const newMaterialIds = useRef<string[]>([]);
  const removedMaterialIds = useRef<string[]>([]);

  function close() {
    if (pendingRef.current || uploadingRef.current || addingTypeRef.current)
      return;
    if (newMaterialIds.current.length)
      void deleteMaterialFiles(newMaterialIds.current);
    newMaterialIds.current = [];
    onClose();
  }

  function setUploadBusy(busy: boolean) {
    uploadingRef.current = busy;
    setUploading(busy);
  }

  function setTypeBusy(busy: boolean) {
    addingTypeRef.current = busy;
    setAddingType(busy);
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
    { values, typeDraft },
    close,
    pending || uploading || addingType,
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
        <DialogPopup className="dialog-popup fixed inset-3 z-[60] mx-auto flex max-w-5xl flex-col overflow-hidden rounded-xl border bg-background outline-none sm:inset-y-6">
          <FormProvider {...form}>
            <form
              noValidate
              className="flex min-h-0 flex-1 flex-col"
              aria-busy={pending || uploading || addingType}
              onSubmit={async (e) => {
                e.preventDefault();
                if (
                  pendingRef.current ||
                  uploadingRef.current ||
                  addingTypeRef.current
                )
                  return;
                if (!(await form.trigger(undefined, { shouldFocus: true })))
                  return;
                if (
                  pendingRef.current ||
                  uploadingRef.current ||
                  addingTypeRef.current
                )
                  return;
                pendingRef.current = true;
                setPending(true);
                setError(null);
                try {
                  await actionToast(
                    () => onSave(values),
                    "Сохраняем…",
                    "Изменения сохранены.",
                  );
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
              <fieldset
                disabled={pending || uploading || addingType}
                className="contents"
              >
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 [overflow-anchor:none] sm:p-7">
                  <Dialog.Title className="pr-10 text-xl font-semibold">
                    {event ? "Редактировать событие" : "Новое событие"}
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                    Дата и время указаны по местному времени поездки.
                  </Dialog.Description>
                  <div className="mt-6 grid gap-4">
                    <Field name="title" label="Название события">
                      {(id) => (
                        <Input
                          data-field-control
                          id={id}
                          required
                          minLength={TEXT_LIMITS.MIN}
                          maxLength={TEXT_LIMITS.EVENT_TITLE}
                          className={inputClass}
                          aria-describedby={describedBy}
                          value={values.title}
                          onChange={(e) => update("title", e.target.value)}
                        />
                      )}
                    </Field>
                    <EventTypeField
                      catalog={trip.eventTypes ?? []}
                      event={event}
                      value={values.customType}
                      draft={typeDraft}
                      onDraftChange={setTypeDraft}
                      onChange={(value) => update("customType", value)}
                      onAdd={onAddEventType}
                      onBusyChange={setTypeBusy}
                      disabled={pending || uploading || addingType}
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field name="start" label="Начало">
                        {(id) => (
                          <Input
                            data-field-control
                            id={id}
                            required
                            type="datetime-local"
                            min={`${startBounds.min}T00:00`}
                            max={`${startBounds.max}T23:59`}
                            className={inputClass}
                            aria-describedby={describedBy}
                            value={values.start}
                            onChange={(e) => update("start", e.target.value)}
                          />
                        )}
                      </Field>
                      <Field name="end" label="Окончание · необязательно">
                        {(id) => (
                          <Input
                            data-field-control
                            id={id}
                            type="datetime-local"
                            min={
                              values.start > `${endBounds.min}T00:00`
                                ? values.start
                                : `${endBounds.min}T00:00`
                            }
                            max={`${endBounds.max}T23:59`}
                            className={inputClass}
                            aria-describedby={describedBy}
                            value={values.end}
                            onChange={(e) => update("end", e.target.value)}
                          />
                        )}
                      </Field>
                    </div>
                    <Field name="description" label="Описание · необязательно">
                      {(id) => (
                        <Textarea
                          data-field-control
                          id={id}
                          minLength={TEXT_LIMITS.MIN}
                          maxLength={TEXT_LIMITS.DESCRIPTION}
                          className={`${inputClass} h-24 py-3`}
                          aria-describedby={describedBy}
                          value={values.description}
                          onChange={(e) =>
                            update("description", e.target.value)
                          }
                        />
                      )}
                    </Field>
                    <Field
                      name="pointId"
                      label="Точка маршрута · необязательно"
                    >
                      {(id) => (
                        <TextSelect
                          data-field-control
                          id={id}
                          value={values.pointId ?? ""}
                          disabled={pending || uploading}
                          options={[
                            { value: "", label: "Без места на карте" },
                            ...points.map((point) => ({
                              value: point.id,
                              label: point.name,
                            })),
                          ]}
                          onValueChange={(value) =>
                            update("pointId", value || null)
                          }
                        />
                      )}
                    </Field>
                    <EventMaterials
                      materials={values.materials}
                      bookingUrl={values.bookingUrl}
                      onBookingChange={(url) => update("bookingUrl", url)}
                      onUploaded={addMaterial}
                      onRemove={removeMaterial}
                      onBusyChange={setUploadBusy}
                      disabled={pending || uploading || addingType}
                      error={form.formState.errors.materials?.message}
                    />
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
                    disabled={pending || uploading || addingType}
                    onClick={requestClose}
                  >
                    Отмена
                  </Button>
                  <Button
                    type="submit"
                    className="h-11"
                    disabled={pending || uploading || addingType}
                  >
                    {uploading
                      ? "Дождитесь загрузки…"
                      : pending
                        ? "Сохраняем…"
                        : "Сохранить событие"}
                  </Button>
                </div>
              </fieldset>
            </form>
          </FormProvider>
        </DialogPopup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
