"use client";
import { Dialog } from "@base-ui/react/dialog";
import dynamic from "next/dynamic";
import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { DialogPopup } from "@/components/ui/dialog-popup";
import { Field, inputClass } from "@/components/ui/field";
import type { RoutePoint, RoutePointValues } from "@/configs/types/route.type";
import { useDiscardConfirmation } from "@/hooks/use-discard-confirmation";
import { validatePoint } from "@/lib/travel-route";

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
  onClose: () => void;
  onSave: (values: RoutePointValues) => void;
}) {
  const [values, setValues] = useState<RoutePointValues>(
    point ?? { name: "", description: "", lat: 0, lng: 0 },
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
        <DialogPopup className="dialog-popup fixed inset-0 z-[60] m-auto flex h-fit max-h-[calc(100dvh-1.5rem)] w-[calc(100%-1.5rem)] max-w-3xl flex-col overflow-hidden rounded-xl border bg-background  outline-none">
          <form
            className="flex min-h-0 flex-1 flex-col"
            aria-busy={pending}
            onSubmit={(event) => {
              event.preventDefault();
              if (pendingRef.current) return;
              const next = {
                ...values,
                lat: lat.trim() ? Number(lat) : Number.NaN,
                lng: lng.trim() ? Number(lng) : Number.NaN,
              };
              const validation = validatePoint(next);
              if (validation) {
                setError(validation);
                return;
              }
              pendingRef.current = true;
              setPending(true);
              setError(null);
              try {
                onSave(next);
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
            <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-7">
              <Dialog.Title className="pr-10 text-xl font-semibold">
                {point ? "Редактировать точку" : "Новая точка маршрута"}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                Нажмите на карту или введите координаты вручную.
              </Dialog.Description>
              <div className="mt-6 grid gap-5">
                <Field label="Название точки">
                  {(id) => (
                    <input
                      id={id}
                      required
                      maxLength={120}
                      className={inputClass}
                      aria-invalid={error ? true : undefined}
                      aria-describedby={error ? errorId : undefined}
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
                <Field label="Описание · необязательно">
                  {(id) => (
                    <textarea
                      id={id}
                      maxLength={1000}
                      className={`${inputClass} h-20 py-3`}
                      aria-invalid={error ? true : undefined}
                      aria-describedby={error ? errorId : undefined}
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
                    }));
                    setLat(String(place.lat));
                    setLng(String(place.lng));
                  }}
                  draftPlace={coordinates}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Широта">
                    {(id) => (
                      <input
                        id={id}
                        required
                        type="number"
                        step="any"
                        min={-90}
                        max={90}
                        className={inputClass}
                        aria-invalid={error ? true : undefined}
                        aria-describedby={error ? errorId : undefined}
                        value={lat}
                        onChange={(event) => setLat(event.target.value)}
                      />
                    )}
                  </Field>
                  <Field label="Долгота">
                    {(id) => (
                      <input
                        id={id}
                        required
                        type="number"
                        step="any"
                        min={-180}
                        max={180}
                        className={inputClass}
                        aria-invalid={error ? true : undefined}
                        aria-describedby={error ? errorId : undefined}
                        value={lng}
                        onChange={(event) => setLng(event.target.value)}
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
          </form>
        </DialogPopup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
