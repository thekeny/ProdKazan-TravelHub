"use client";

import { Dialog } from "@base-ui/react/dialog";
import { CalendarDays, Plus } from "lucide-react";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { EventForm } from "@/components/dashboard/event-form";
import { EventTimeline } from "@/components/dashboard/event-timeline";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import type { TripEvent } from "@/configs/types/event.type";
import type { Trip } from "@/configs/types/travel.type";
import { eventsForDay, tripDays } from "@/lib/travel-events";
import { formatTripDates } from "@/lib/travel-format";
import { useTravel } from "@/providers/travel-provider";

const TripMap = dynamic(() => import("./trip-map"), {
  ssr: false,
  loading: () => (
    <output className="block h-[360px] animate-pulse rounded-xl border bg-muted p-5 sm:h-[500px] xl:h-[640px]">
      Загрузка карты…
    </output>
  ),
});

export function TripOverview() {
  const { trips, activeId } = useTravel();
  const trip = trips.find((item) => item.id === activeId);
  return trip ? <Overview key={trip.id} trip={trip} /> : null;
}

function Overview({ trip }: { trip: Trip }) {
  const { saveEvent, deleteEvent } = useTravel();
  const [day, setDay] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editor, setEditor] = useState<{ event?: TripEvent } | null>(null);
  const [deleting, setDeleting] = useState<TripEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const events = useMemo(
    () => eventsForDay(trip.events ?? [], day),
    [trip.events, day],
  );
  const days = useMemo(() => tripDays(trip), [trip]);
  return (
    <div className="mx-auto max-w-[1600px]">
      <header className="flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">Обзор путешествия</p>
          <h1 className="mt-2 break-words text-3xl font-semibold tracking-tight sm:text-4xl">
            {trip.name}
          </h1>
          <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="size-4" />
            {formatTripDates(trip)}
          </p>
        </div>
        <Button className="h-11" onClick={() => setEditor({})}>
          <Plus />
          Добавить событие
        </Button>
      </header>
      <div className="my-7 max-w-xs">
        <Field label="События поездки">
          {(id) => (
            <select
              id={id}
              className={inputClass}
              value={day}
              onChange={(e) => {
                setDay(e.target.value);
                setSelectedId(null);
              }}
            >
              <option value="">Все дни</option>
              {days.map((value, index) => (
                <option key={value} value={value}>
                  День {index + 1} · {value.split("-").reverse().join(".")}
                </option>
              ))}
            </select>
          )}
        </Field>
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
        <section className="min-w-0">
          <h2 className="mb-3 text-lg font-semibold">Карта поездки</h2>
          <TripMap
            events={events}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </section>
        <section className="min-w-0">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Хронология</h2>
            <span className="text-sm text-muted-foreground">
              {events.length}
            </span>
          </div>
          {events.length ? (
            <EventTimeline
              events={events}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onEdit={(event) => setEditor({ event })}
              onDelete={(event) => {
                setError(null);
                setDeleting(event);
              }}
            />
          ) : (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed bg-background p-6 text-center">
              <CalendarDays className="mb-4 size-8 text-muted-foreground" />
              <h3 className="font-medium">
                {day
                  ? "В этот день пока нет событий"
                  : "История поездки начинается здесь"}
              </h3>
              <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                Добавьте первую прогулку, встречу или заселение. Места событий
                появятся на карте.
              </p>
              <Button
                variant="outline"
                className="mt-5 h-11"
                onClick={() => setEditor({})}
              >
                <Plus />
                Добавить событие
              </Button>
            </div>
          )}
        </section>
      </div>
      {editor && (
        <EventForm
          trip={trip}
          event={editor.event}
          day={day}
          onClose={() => setEditor(null)}
          onSave={(values) => {
            saveEvent(trip.id, values, editor.event?.id);
            setEditor(null);
            setDay("");
            setSelectedId(editor.event?.id ?? null);
          }}
        />
      )}
      <Dialog.Root
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-overlay/35" />
          <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-background p-6 shadow-xl">
            <Dialog.Title className="text-lg font-semibold">
              Удалить событие?
            </Dialog.Title>
            <Dialog.Description className="mt-2 break-words text-sm text-muted-foreground">
              «{deleting?.title}» будет удалено из ленты и с карты.
            </Dialog.Description>
            {error && (
              <p role="alert" className="mt-3 text-sm text-destructive">
                {error}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                className="h-11"
                onClick={() => setDeleting(null)}
              >
                Отмена
              </Button>
              <Button
                variant="destructive"
                className="h-11"
                onClick={() => {
                  if (!deleting) return;
                  try {
                    deleteEvent(trip.id, deleting.id);
                    if (selectedId === deleting.id) setSelectedId(null);
                    setDeleting(null);
                  } catch (error) {
                    setError(
                      error instanceof Error
                        ? error.message
                        : "Не удалось удалить событие.",
                    );
                  }
                }}
              >
                Удалить
              </Button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
