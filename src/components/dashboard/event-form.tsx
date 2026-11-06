"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Trash2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { EVENT_TYPES } from "@/configs/consts/events.const";
import type { EventValues, TripEvent } from "@/configs/types/event.type";
import type { Trip } from "@/configs/types/travel.type";
import { validateEvent } from "@/lib/travel-events";

const EMPTY_EVENTS: TripEvent[] = [];

const TripMap = dynamic(() => import("./trip-map"), {
  ssr: false,
  loading: () => (
    <output className="block h-[360px] animate-pulse rounded-xl bg-muted">
      Загрузка карты…
    </output>
  ),
});

export function EventForm({
  trip,
  event,
  day,
  onClose,
  onSave,
}: {
  trip: Trip;
  event?: TripEvent;
  day: string;
  onClose: () => void;
  onSave: (values: EventValues) => void;
}) {
  const [values, setValues] = useState<EventValues>(
    event ?? {
      title: "",
      type: "walk",
      start: `${day || trip.startDate}T09:00`,
      end: "",
      description: "",
      place: null,
    },
  );
  const [error, setError] = useState<string | null>(null);
  const [lat, setLat] = useState(event?.place?.lat.toString() ?? "");
  const [lng, setLng] = useState(event?.place?.lng.toString() ?? "");
  function update<K extends keyof EventValues>(key: K, value: EventValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-overlay/35" />
        <Dialog.Popup className="fixed inset-3 z-50 mx-auto max-w-3xl overflow-y-auto rounded-xl border bg-background p-5 shadow-xl sm:inset-y-8 sm:p-8">
          <Dialog.Title className="text-xl font-semibold">
            {event ? "Редактировать событие" : "Новое событие"}
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-muted-foreground">
            Дата и время указаны по местному времени поездки.
          </Dialog.Description>
          <form
            className="mt-6 grid gap-5"
            onSubmit={(e) => {
              e.preventDefault();
              const next = {
                ...values,
                place: values.place
                  ? {
                      ...values.place,
                      lat: lat.trim() ? Number(lat) : Number.NaN,
                      lng: lng.trim() ? Number(lng) : Number.NaN,
                    }
                  : null,
              };
              const validation = validateEvent(next, trip);
              if (validation) {
                setError(validation);
                return;
              }
              try {
                onSave(next);
              } catch (error) {
                setError(
                  error instanceof Error
                    ? error.message
                    : "Не удалось сохранить событие.",
                );
              }
            }}
          >
            <Field label="Название события">
              {(id) => (
                <input
                  id={id}
                  required
                  className={inputClass}
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
                  className={`${inputClass} h-24 py-3`}
                  value={values.description}
                  onChange={(e) => update("description", e.target.value)}
                />
              )}
            </Field>
            <fieldset className="grid min-w-0 gap-4">
              <legend className="mb-3 text-sm font-medium">
                Место · необязательно
              </legend>
              <TripMap
                events={EMPTY_EVENTS}
                selectedId={null}
                onSelect={() => {}}
                draftPlace={
                  values.place &&
                  lat.trim() !== "" &&
                  lng.trim() !== "" &&
                  Number.isFinite(Number(lat)) &&
                  Number.isFinite(Number(lng)) &&
                  Math.abs(Number(lat)) <= 90 &&
                  Math.abs(Number(lng)) <= 180
                    ? { ...values.place, lat: Number(lat), lng: Number(lng) }
                    : null
                }
                onPlace={(place) => {
                  update("place", {
                    ...place,
                    name: values.place?.name || place.name,
                  });
                  setLat(String(place.lat));
                  setLng(String(place.lng));
                }}
              />
              {!values.place ? (
                <Button
                  variant="outline"
                  className="h-11 justify-self-start"
                  onClick={() => update("place", { name: "", lat: 0, lng: 0 })}
                >
                  Ввести координаты
                </Button>
              ) : (
                <>
                  <Field label="Название места">
                    {(id) => (
                      <input
                        id={id}
                        required
                        className={inputClass}
                        value={values.place?.name ?? ""}
                        onChange={(e) => {
                          if (values.place)
                            update("place", {
                              ...values.place,
                              name: e.target.value,
                            });
                        }}
                      />
                    )}
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
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
                          value={lat}
                          onChange={(e) => setLat(e.target.value)}
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
                          value={lng}
                          onChange={(e) => setLng(e.target.value)}
                        />
                      )}
                    </Field>
                  </div>
                  <Button
                    variant="destructive"
                    className="h-11 justify-self-start"
                    onClick={() => {
                      update("place", null);
                      setLat("");
                      setLng("");
                    }}
                  >
                    <Trash2 />
                    Убрать место
                  </Button>
                </>
              )}
            </fieldset>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-3">
              <Button variant="outline" className="h-11" onClick={onClose}>
                Отмена
              </Button>
              <Button type="submit" className="h-11">
                Сохранить событие
              </Button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
