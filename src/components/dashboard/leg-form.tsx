"use client";
import { Dialog } from "@base-ui/react/dialog";
import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { DialogPopup } from "@/components/ui/dialog-popup";
import { Field, inputClass } from "@/components/ui/field";
import { BACKEND_LIMITS } from "@/configs/consts/backend.const";
import {
  TRANSPORT_TYPES,
  type TransportKind,
} from "@/configs/consts/transport.const";
import type {
  RoutePoint,
  TripLeg,
  TripLegValues,
} from "@/configs/types/route.type";
import type { TripValues } from "@/configs/types/travel.type";
import { useDiscardConfirmation } from "@/hooks/use-discard-confirmation";
import { validateLeg } from "@/lib/travel-route";
import { useTravel } from "@/providers/travel-provider";

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
  const { remote } = useTravel();
  const [values, setValues] = useState<TripLegValues>(
    leg ?? {
      fromPointId: points[0]?.id ?? "",
      toPointId: points[1]?.id ?? "",
      transport: "car",
      start: `${day || trip.startDate}T09:00`,
      end: `${day || trip.startDate}T10:00`,
      description: "",
    },
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
        <DialogPopup className="dialog-popup fixed inset-0 z-[60] m-auto flex h-fit max-h-[calc(100dvh-1.5rem)] w-[calc(100%-1.5rem)] max-w-2xl flex-col overflow-hidden rounded-xl border bg-background  outline-none">
          <form
            className="flex min-h-0 flex-1 flex-col"
            aria-busy={pending}
            onSubmit={async (event) => {
              event.preventDefault();
              if (pendingRef.current) return;
              const validation = validateLeg(values, trip, points);
              if (validation) {
                setError(validation);
                return;
              }
              pendingRef.current = true;
              setPending(true);
              setError(null);
              try {
                await onSave(values);
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
            <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-7">
              <Dialog.Title className="pr-10 text-xl font-semibold">
                {leg ? "Редактировать перемещение" : "Новое перемещение"}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                Дата и время указаны по местному времени поездки.
              </Dialog.Description>
              <div className="mt-6 grid gap-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Откуда">
                    {(id) => (
                      <select
                        id={id}
                        className={inputClass}
                        aria-invalid={error ? true : undefined}
                        aria-describedby={error ? errorId : undefined}
                        value={values.fromPointId}
                        onChange={(event) =>
                          update("fromPointId", event.target.value)
                        }
                      >
                        {points.map((point) => (
                          <option key={point.id} value={point.id}>
                            {point.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </Field>
                  <Field label="Куда">
                    {(id) => (
                      <select
                        id={id}
                        className={inputClass}
                        aria-invalid={error ? true : undefined}
                        aria-describedby={error ? errorId : undefined}
                        value={values.toPointId}
                        onChange={(event) =>
                          update("toPointId", event.target.value)
                        }
                      >
                        {points.map((point) => (
                          <option key={point.id} value={point.id}>
                            {point.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </Field>
                </div>
                <Field label="Способ передвижения">
                  {(id) => (
                    <select
                      id={id}
                      className={inputClass}
                      value={values.transport}
                      onChange={(event) => {
                        const transport = event.target.value;
                        if (Object.hasOwn(TRANSPORT_TYPES, transport))
                          update("transport", transport as TransportKind);
                      }}
                    >
                      {Object.entries(TRANSPORT_TYPES).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  )}
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Отправление">
                    {(id) => (
                      <input
                        id={id}
                        required
                        type="datetime-local"
                        min={`${trip.startDate}T00:00`}
                        max={`${trip.endDate}T23:59`}
                        className={inputClass}
                        aria-invalid={error ? true : undefined}
                        aria-describedby={error ? errorId : undefined}
                        value={values.start}
                        onChange={(event) =>
                          update("start", event.target.value)
                        }
                      />
                    )}
                  </Field>
                  <Field label="Прибытие">
                    {(id) => (
                      <input
                        id={id}
                        required
                        type="datetime-local"
                        min={values.start}
                        max={`${trip.endDate}T23:59`}
                        className={inputClass}
                        aria-invalid={error ? true : undefined}
                        aria-describedby={error ? errorId : undefined}
                        value={values.end}
                        onChange={(event) => update("end", event.target.value)}
                      />
                    )}
                  </Field>
                </div>
                <Field
                  label="Описание · необязательно"
                  hint={
                    remote && leg
                      ? "API пока не поддерживает изменение описания перемещения."
                      : undefined
                  }
                >
                  {(id, describedBy) => (
                    <textarea
                      id={id}
                      className={`${inputClass} h-20 py-3`}
                      aria-invalid={error ? true : undefined}
                      aria-describedby={error ? errorId : describedBy}
                      maxLength={BACKEND_LIMITS.DESCRIPTION}
                      readOnly={Boolean(remote && leg)}
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
          </form>
        </DialogPopup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
