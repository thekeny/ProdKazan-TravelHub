"use client";

import { Dialog } from "@base-ui/react/dialog";
import dynamic from "next/dynamic";
import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import type { RoutePoint, RoutePointValues } from "@/configs/types/route.type";
import { validatePoint } from "@/lib/travel-route";

const TripMap = dynamic(() => import("./trip-map"), {
  ssr: false,
  loading: () => (
    <output className="block h-[360px] animate-pulse rounded-xl bg-muted">
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
  return (
    <Dialog.Root
      open
      disablePointerDismissal
      onOpenChange={(open) => {
        if (!open && !pending) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[60] bg-overlay/35" />
        <Dialog.Popup className="fixed inset-3 z-[60] mx-auto max-w-3xl overflow-y-auto rounded-xl border bg-background p-5 shadow-xl sm:inset-y-8 sm:p-8">
          <Dialog.Title className="text-xl font-semibold">
            {point ? "Редактировать точку" : "Новая точка маршрута"}
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-muted-foreground">
            Нажмите на карту или введите координаты вручную.
          </Dialog.Description>
          <form
            className="mt-6 grid gap-5"
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
              <p id={errorId} role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                className="h-11"
                type="button"
                disabled={pending}
                onClick={onClose}
              >
                Отмена
              </Button>
              <Button type="submit" className="h-11" disabled={pending}>
                {pending ? "Сохраняем…" : "Сохранить точку"}
              </Button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
