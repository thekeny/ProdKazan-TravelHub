"use client";
import { Dialog } from "@base-ui/react/dialog";
import dynamic from "next/dynamic";
import { useId, useRef, useState } from "react";
import { FormProvider } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { DialogPopup } from "@/components/ui/dialog-popup";
import { Field } from "@/components/ui/field";
import { Input, inputClass } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TEXT_LIMITS } from "@/configs/consts/validation.const";
import type { RoutePoint, RoutePointValues } from "@/configs/types/route.type";
import { useDiscardConfirmation } from "@/hooks/use-discard-confirmation";
import { useFormValues } from "@/hooks/use-form-values";
import { actionToast } from "@/lib/action-toast";
import { pointErrors } from "@/lib/form-validation";

const TripMap = dynamic(() => import("./trip-map"), {
  ssr: false,
  loading: () => (
    <output className="grid h-64 place-items-center rounded-xl bg-muted text-sm text-muted-foreground sm:h-72">
      Загрузка карты…
    </output>
  ),
});

export function PointForm({
  points,
  point,
  onClose,
  onSave,
}: {
  points: RoutePoint[];
  point?: RoutePoint;
  onClose: () => void | Promise<void>;
  onSave: (values: RoutePointValues) => void | Promise<void>;
}) {
  const [values, setValues, form] = useFormValues<RoutePointValues>(
    point ?? { name: "", description: "", lat: Number.NaN, lng: Number.NaN },
    (values) => pointErrors(values),
  );
  const [lat, setLat] = useState(point ? String(point.lat) : "");
  const [lng, setLng] = useState(point ? String(point.lng) : "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);
  const errorId = useId();
  const coordinates =
    lat.trim() !== "" &&
    lng.trim() !== "" &&
    Number.isFinite(Number(lat)) &&
    Number.isFinite(Number(lng)) &&
    Math.abs(Number(lat)) <= 90 &&
    Math.abs(Number(lng)) <= 180
      ? { lat: Number(lat), lng: Number(lng) }
      : null;
  const { requestClose, confirmation } = useDiscardConfirmation(
    { values, lat, lng },
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
        <DialogPopup className="dialog-popup fixed inset-0 z-[60] m-auto flex h-fit max-h-[calc(100dvh-1.5rem)] w-[calc(100%-1.5rem)] max-w-5xl flex-col overflow-hidden rounded-xl border bg-background  outline-none">
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
                const next = {
                  ...values,
                  lat: lat.trim() ? Number(lat) : Number.NaN,
                  lng: lng.trim() ? Number(lng) : Number.NaN,
                };
                pendingRef.current = true;
                setPending(true);
                setError(null);
                try {
                  await actionToast(
                    () => onSave(next),
                    "Сохраняем…",
                    "Изменения сохранены.",
                  );
                } catch (error) {
                  pendingRef.current = false;
                  setPending(false);
                  setError(
                    error instanceof Error
                      ? error.message
                      : "Не удалось сохранить точку.",
                  );
                }
              }}
            >
              <fieldset disabled={pending} className="contents">
                <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-7">
                  <Dialog.Title className="pr-10 text-xl font-semibold">
                    {point ? "Редактировать точку" : "Новая точка маршрута"}
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                    Нажмите на карту или введите координаты вручную.
                  </Dialog.Description>
                  <div className="mt-6 grid gap-4">
                    <Field name="name" label="Название точки">
                      {(id) => (
                        <Input
                          data-field-control
                          id={id}
                          required
                          minLength={TEXT_LIMITS.MIN}
                          maxLength={TEXT_LIMITS.NAME}
                          className={inputClass}
                          value={values.name}
                          placeholder="Аэропорт Казани"
                          onChange={(event) =>
                            setValues((current) => ({
                              ...current,
                              name: event.target.value,
                            }))
                          }
                        />
                      )}
                    </Field>
                    <Field name="description" label="Описание · необязательно">
                      {(id) => (
                        <Textarea
                          data-field-control
                          id={id}
                          minLength={TEXT_LIMITS.MIN}
                          maxLength={TEXT_LIMITS.DESCRIPTION}
                          className={`${inputClass} h-20 py-3`}
                          value={values.description}
                          onChange={(event) =>
                            setValues((current) => ({
                              ...current,
                              description: event.target.value,
                            }))
                          }
                        />
                      )}
                    </Field>
                    <TripMap
                      points={points}
                      selectedPointId={point?.id ?? null}
                      className="h-64 sm:h-72"
                      onPlace={(place) => {
                        setValues((current) => ({
                          ...current,
                          name: current.name || "Выбранное место",
                          lat: place.lat,
                          lng: place.lng,
                        }));
                        setLat(String(place.lat));
                        setLng(String(place.lng));
                      }}
                      draftPlace={coordinates}
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field name="lat" label="Широта">
                        {(id) => (
                          <Input
                            data-field-control
                            id={id}
                            required
                            type="number"
                            step="any"
                            min={-90}
                            max={90}
                            className={inputClass}
                            value={lat}
                            onChange={(event) => {
                              setLat(event.target.value);
                              setValues((current) => ({
                                ...current,
                                lat: event.target.value.trim()
                                  ? Number(event.target.value)
                                  : Number.NaN,
                              }));
                            }}
                          />
                        )}
                      </Field>
                      <Field name="lng" label="Долгота">
                        {(id) => (
                          <Input
                            data-field-control
                            id={id}
                            required
                            type="number"
                            step="any"
                            min={-180}
                            max={180}
                            className={inputClass}
                            value={lng}
                            onChange={(event) => {
                              setLng(event.target.value);
                              setValues((current) => ({
                                ...current,
                                lng: event.target.value.trim()
                                  ? Number(event.target.value)
                                  : Number.NaN,
                              }));
                            }}
                          />
                        )}
                      </Field>
                    </div>
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
                    {pending ? "Сохраняем…" : "Сохранить точку"}
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
