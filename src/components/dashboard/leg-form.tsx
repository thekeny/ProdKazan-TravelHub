"use client";
import { Dialog } from "@base-ui/react/dialog";
import { useId, useRef, useState } from "react";
import { FormProvider } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { DateRangeFields } from "@/components/ui/date-range-fields";
import { DialogPopup } from "@/components/ui/dialog-popup";
import { Field } from "@/components/ui/field";
import { inputClass } from "@/components/ui/input";
import { TextSelect } from "@/components/ui/text-select";
import { Textarea } from "@/components/ui/textarea";
import {
  TRANSPORT_TYPES,
  type TransportKind,
} from "@/configs/consts/transport.const";
import { TEXT_LIMITS } from "@/configs/consts/validation.const";
import type {
  RoutePoint,
  TripLeg,
  TripLegValues,
} from "@/configs/types/route.type";
import type { TripValues } from "@/configs/types/travel.type";
import { useDiscardConfirmation } from "@/hooks/use-discard-confirmation";
import { useFormValues } from "@/hooks/use-form-values";
import { actionToast } from "@/lib/action-toast";
import { legErrors } from "@/lib/form-validation";
export function LegForm({
  trip,
  points,
  leg,
  day,
  onClose,
  onSave,
}: {
  trip: TripValues;
  points: RoutePoint[];
  leg?: TripLeg;
  day: string;
  onClose: () => void;
  onSave: (values: TripLegValues) => void | Promise<void>;
}) {
  const [values, setValues, form] = useFormValues<TripLegValues>(
    leg ?? {
      fromPointId: points[0]?.id ?? "",
      toPointId: points[1]?.id ?? "",
      transport: "car",
      start: `${day || trip.startDate}T09:00`,
      end: `${day || trip.startDate}T10:00`,
      description: "",
    },
    (values) => legErrors(values, trip, points, { initial: leg }),
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);
  const errorId = useId();
  function update<K extends keyof TripLegValues>(
    key: K,
    value: TripLegValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }
  const { requestClose, confirmation } = useDiscardConfirmation(
    values,
    onClose,
    pending,
  );
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
        <DialogPopup className="dialog-popup fixed inset-0 z-[60] m-auto flex h-fit max-h-[calc(100dvh-1.5rem)] w-[calc(100%-1.5rem)] max-w-4xl flex-col overflow-hidden rounded-xl border bg-background  outline-none">
          <FormProvider {...form}>
            <form
              noValidate
              className="flex min-h-0 flex-1 flex-col"
              aria-busy={pending}
              onSubmit={async (event) => {
                event.preventDefault();
                if (!(await form.trigger(undefined, { shouldFocus: true })))
                  return;
                if (pendingRef.current) return;
                pendingRef.current = true;
                setPending(true);
                setError(null);
                try {
                  await actionToast(
                    () => onSave(values),
                    "Сохраняем…",
                    "Изменения сохранены.",
                  );
                } catch (error) {
                  pendingRef.current = false;
                  setPending(false);
                  setError(
                    error instanceof Error
                      ? error.message
                      : "Не удалось сохранить перемещение.",
                  );
                }
              }}
            >
              <fieldset disabled={pending} className="contents">
                <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-7">
                  <Dialog.Title className="pr-10 text-xl font-semibold">
                    {leg ? "Редактировать перемещение" : "Новое перемещение"}
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                    Дата и время указаны по местному времени поездки.
                  </Dialog.Description>
                  <div className="mt-6 grid gap-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field name="fromPointId" label="Откуда">
                        {(id) => (
                          <TextSelect
                            data-field-control
                            id={id}
                            value={values.fromPointId}
                            disabled={pending}
                            options={points.map((point) => ({
                              value: point.id,
                              label: point.name,
                            }))}
                            onValueChange={(value) =>
                              update("fromPointId", value)
                            }
                          />
                        )}
                      </Field>
                      <Field name="toPointId" label="Куда">
                        {(id) => (
                          <TextSelect
                            data-field-control
                            id={id}
                            value={values.toPointId}
                            disabled={pending}
                            options={points.map((point) => ({
                              value: point.id,
                              label: point.name,
                            }))}
                            onValueChange={(value) =>
                              update("toPointId", value)
                            }
                          />
                        )}
                      </Field>
                    </div>
                    <Field name="transport" label="Способ передвижения">
                      {(id) => (
                        <TextSelect
                          data-field-control
                          id={id}
                          value={values.transport}
                          disabled={pending}
                          options={Object.entries(TRANSPORT_TYPES).map(
                            ([value, label]) => ({ value, label }),
                          )}
                          onValueChange={(value) => {
                            if (Object.hasOwn(TRANSPORT_TYPES, value))
                              update("transport", value as TransportKind);
                          }}
                        />
                      )}
                    </Field>
                    <DateRangeFields
                      start={values.start}
                      end={values.end}
                      startName="start"
                      endName="end"
                      initialStart={leg?.start}
                      initialEnd={leg?.end}
                      trip={trip}
                      withTime
                      startLabel="Отправление"
                      endLabel="Прибытие"
                      disabled={pending}
                      onChange={(start, end) =>
                        setValues((current) => ({ ...current, start, end }))
                      }
                    />
                    <Field
                      name="description"
                      label="Описание (необязательно)"
                      hint={
                        leg
                          ? "API пока не поддерживает изменение описания перемещения."
                          : undefined
                      }
                    >
                      {(id, describedBy) => (
                        <Textarea
                          data-field-control
                          id={id}
                          className={`${inputClass} h-20 py-3`}
                          aria-describedby={error ? errorId : describedBy}
                          minLength={TEXT_LIMITS.MIN}
                          maxLength={TEXT_LIMITS.DESCRIPTION}
                          readOnly={Boolean(leg)}
                          value={values.description}
                          onChange={(event) =>
                            update("description", event.target.value)
                          }
                        />
                      )}
                    </Field>
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
                    disabled={pending}
                    onClick={requestClose}
                  >
                    Отмена
                  </Button>
                  <Button type="submit" className="h-11" disabled={pending}>
                    {pending ? "Сохраняем…" : "Сохранить перемещение"}
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
