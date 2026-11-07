"use client";

import { Dialog } from "@base-ui/react/dialog";
import { CalendarDays, List, Plus, Route as RouteIcon, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useMemo, useRef, useState } from "react";
import { DayFeed } from "@/components/dashboard/day-feed";
import { EventDetails } from "@/components/dashboard/event-details";
import { EventForm } from "@/components/dashboard/event-form";
import { LegForm } from "@/components/dashboard/leg-form";
import { PointDetails } from "@/components/dashboard/point-details";
import { PointForm } from "@/components/dashboard/point-form";
import { RoutePanel } from "@/components/dashboard/route-panel";
import { ScheduleCheckDialog } from "@/components/dashboard/schedule-check";
import { TripTimeline } from "@/components/dashboard/trip-timeline";
import { StorageWarning } from "@/components/layout/storage-warning";
import { TripActions } from "@/components/trips/trip-actions";
import { Button } from "@/components/ui/button";
import { ConfirmDelete } from "@/components/ui/confirm-delete";
import { DialogPopup } from "@/components/ui/dialog-popup";
import type { TripEvent } from "@/configs/types/event.type";
import type { RoutePoint, TripLeg } from "@/configs/types/route.type";
import type { Trip } from "@/configs/types/travel.type";
import { useOverviewNavigation } from "@/hooks/use-overview-navigation";
import { actionToast } from "@/lib/action-toast";
import { tripDays } from "@/lib/travel-events";
import { formatTripDates } from "@/lib/travel-format";
import {
  buildTimeline,
  itemStartMinutes,
  legsForDay,
  minutesToTime,
  pointsForDay,
  positionAtTime,
  timeToMinutes,
} from "@/lib/travel-route";
import type { ScheduleIssue } from "@/lib/travel-schedule";
import { useTravel } from "@/providers/travel-provider";
import { TripDayNavigation } from "./trip-day-navigation";

const TripMap = dynamic(() => import("./trip-map"), {
  ssr: false,
  loading: () => (
    <output className="grid h-full place-items-center bg-muted text-sm text-muted-foreground">
      Загрузка карты…
    </output>
  ),
});

type Deletion =
  | { kind: "event"; event: TripEvent }
  | { kind: "point"; point: RoutePoint }
  | { kind: "leg"; leg: TripLeg };

const deletionTitle: Record<Deletion["kind"], string> = {
  event: "Удалить событие?",
  point: "Удалить точку маршрута?",
  leg: "Удалить перемещение?",
};

function deletionText(deletion: Deletion) {
  if (deletion.kind === "event")
    return `«${deletion.event.title}» будет удалено из хронологии и с карты. Прикреплённые материалы тоже удалятся.`;
  if (deletion.kind === "leg")
    return "Перемещение исчезнет с карты и из хронологии. Точки маршрута останутся.";
  return `«${deletion.point.name}» будет удалена с карты. Связанные перемещения исчезнут, а события останутся без места.`;
}

export function TripOverview() {
  const { trips, activeId } = useTravel();
  const trip = trips.find((item) => item.id === activeId);
  return trip ? <Overview key={trip.id} trip={trip} /> : null;
}

function Overview({ trip }: { trip: Trip }) {
  const { saveEvent, deleteEvent, savePoint, deletePoint, saveLeg, deleteLeg } =
    useTravel();
  const points = trip.points ?? [];
  const legs = trip.legs ?? [];
  const events = trip.events ?? [];
  const days = useMemo(() => tripDays(trip), [trip]);
  const {
    day,
    setDay,
    minutes,
    setMinutes,
    showAll,
    setShowAll,
    detailsEvent,
    setDetailsEvent,
    changeDay,
    openEvent,
  } = useOverviewNavigation(trip);
  const [routeOpen, setRouteOpen] = useState(false);
  const [feedOpen, setFeedOpen] = useState(false);
  const [eventEditor, setEventEditor] = useState<{
    event?: TripEvent;
    pointId?: string | null;
  } | null>(null);
  const [pointEditor, setPointEditor] = useState<{ point?: RoutePoint } | null>(
    null,
  );
  const [legEditor, setLegEditor] = useState<{ leg?: TripLeg } | null>(null);
  const [deletion, setDeletion] = useState<Deletion | null>(null);
  const [deleting, setDeleting] = useState(false);
  const deletingRef = useRef(false);
  const [detailsPointId, setDetailsPointId] = useState<string | null>(null);
  const [timelineInset, setTimelineInset] = useState(176);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const dayLegs = useMemo(() => legsForDay(legs, day), [legs, day]);
  const allLegs = useMemo(
    () =>
      [...legs].sort(
        (a, b) => a.start.localeCompare(b.start) || a.id.localeCompare(b.id),
      ),
    [legs],
  );
  const visiblePoints = useMemo(
    () => (showAll ? points : pointsForDay(points, events, legs, day)),
    [showAll, points, events, legs, day],
  );
  const visibleLegs = showAll ? allLegs : dayLegs;
  const timeline = useMemo(
    () => buildTimeline(events, legs, day),
    [events, legs, day],
  );
  const position = useMemo(
    () => positionAtTime(timeline, points, day, minutes),
    [timeline, points, day, minutes],
  );
  const detailsPoint = detailsPointId
    ? (points.find((point) => point.id === detailsPointId) ?? null)
    : null;

  function showIssue(issue: ScheduleIssue) {
    const event = events.find((item) => issue.itemIds.includes(item.id));
    if (event) {
      openEvent(event);
      return;
    }
    const leg = legs.find((item) => issue.itemIds.includes(item.id));
    if (!leg) return;
    setDay(leg.start.slice(0, 10));
    setShowAll(false);
    setMinutes(timeToMinutes(leg.start));
    setFeedOpen(true);
  }

  function jumpToPoint(pointId: string) {
    const item = timeline.find((entry) =>
      entry.kind === "event"
        ? entry.event.pointId === pointId
        : entry.leg.fromPointId === pointId || entry.leg.toPointId === pointId,
    );
    if (item) {
      setMinutes(itemStartMinutes(item));
      return;
    }
    const source =
      events.find((event) => event.pointId === pointId)?.start ??
      legs.find(
        (leg) => leg.fromPointId === pointId || leg.toPointId === pointId,
      )?.start;
    if (!source) return;
    setDay(source.slice(0, 10));
    setShowAll(false);
    setMinutes(timeToMinutes(source));
  }

  function jumpToLeg(legId: string) {
    const item = timeline.find(
      (entry) => entry.kind === "leg" && entry.id === legId,
    );
    if (item) {
      setMinutes(itemStartMinutes(item));
      return;
    }
    const leg = legs.find((entry) => entry.id === legId);
    if (!leg) return;
    setDay(leg.start.slice(0, 10));
    setShowAll(false);
    setMinutes(timeToMinutes(leg.start));
  }

  async function confirmDelete() {
    if (!deletion || deletingRef.current) return;
    deletingRef.current = true;
    setDeleting(true);
    try {
      if (deletion.kind === "event")
        await actionToast(
          () => deleteEvent(trip.id, deletion.event.id),
          "Удаляем…",
          "Запись удалена.",
        );
      if (deletion.kind === "point")
        await actionToast(
          () => deletePoint(trip.id, deletion.point.id),
          "Удаляем…",
          "Запись удалена.",
        );
      if (deletion.kind === "leg")
        await actionToast(
          () => deleteLeg(trip.id, deletion.leg.id),
          "Удаляем…",
          "Запись удалена.",
        );
      setDeletion(null);
    } catch {
    } finally {
      deletingRef.current = false;
      setDeleting(false);
    }
  }

  function openEventEditor(event?: TripEvent, pointId?: string | null) {
    setDetailsEvent(null);
    setEventEditor({ event, pointId });
  }

  function openPointEditor(point?: RoutePoint) {
    setDetailsPointId(null);
    setPointEditor({ point });
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <header className="shrink-0 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="font-display min-w-0 user-text whitespace-normal text-xl leading-tight sm:text-3xl">
              {trip.name}
            </h1>
            <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
              <CalendarDays aria-hidden="true" className="size-3.5 shrink-0" />
              <span className="user-text whitespace-normal">
                {formatTripDates(trip)}
              </span>
            </div>
          </div>
          <div className="flex w-full shrink-0 items-center justify-end gap-2 sm:w-auto">
            <TripActions
              trip={trip}
              onCheckSchedule={() => setScheduleOpen(true)}
            />
            <Button
              variant="outline"
              className="h-9"
              aria-expanded={routeOpen}
              aria-controls="route-panel"
              aria-label={
                routeOpen
                  ? "Скрыть редактор маршрута"
                  : "Открыть редактор маршрута"
              }
              title="Маршрут"
              onClick={() => {
                setRouteOpen((value) => !value);
                setFeedOpen(false);
              }}
            >
              <RouteIcon />
              <span className="hidden lg:inline">Маршрут</span>
            </Button>
            <Button
              variant="outline"
              className="h-9"
              aria-expanded={feedOpen}
              aria-label={feedOpen ? "Закрыть ленту дня" : "Открыть ленту дня"}
              title="Лента дня"
              onClick={() => {
                setFeedOpen((value) => !value);
                setRouteOpen(false);
              }}
            >
              <List />
              <span className="hidden lg:inline">Лента</span>
            </Button>
            <Button
              className="h-9"
              aria-label="Добавить событие"
              title="Добавить событие"
              onClick={() => openEventEditor()}
            >
              <Plus />
              <span className="sm:hidden">Событие</span>
              <span className="hidden lg:inline">Добавить событие</span>
            </Button>
          </div>
        </div>
        <TripDayNavigation
          days={days}
          day={day}
          showAll={showAll}
          onChangeDay={changeDay}
          onToggleAll={() => setShowAll((value) => !value)}
        />
      </header>
      <StorageWarning className="mx-4 mt-2 shrink-0" />

      <section className="relative min-h-0 flex-1">
        <TripMap
          className="h-full rounded-none border-0"
          points={visiblePoints}
          legs={visibleLegs}
          selectedPointId={position.pointId}
          selectedLegId={position.legId}
          currentPosition={
            position.lat !== null && position.lng !== null
              ? { lat: position.lat, lng: position.lng }
              : null
          }
          onSelectPoint={(pointId) => {
            setDetailsPointId(pointId);
            jumpToPoint(pointId);
          }}
          onSelectLeg={jumpToLeg}
          overlayInset={timelineInset}
        />
        <TripTimeline
          items={timeline}
          day={day}
          minutes={minutes}
          position={position}
          onScrub={setMinutes}
          onSelectEvent={openEvent}
          onSelectLeg={(leg) => jumpToLeg(leg.id)}
          onEditEvent={(event) => openEventEditor(event)}
          onDeleteEvent={(event) => {
            setDetailsEvent(null);
            setDeletion({ kind: "event", event });
          }}
          onEditLeg={(leg) => {
            setDetailsEvent(null);
            setLegEditor({ leg });
          }}
          onDeleteLeg={(leg) => {
            setDetailsEvent(null);
            setDeletion({ kind: "leg", leg });
          }}
          onHeightChange={setTimelineInset}
        />
        {visiblePoints.length === 0 && (
          <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center px-4 pb-40">
            <div className="pointer-events-auto max-w-sm rounded-xl border bg-surface/95 p-4 text-center ">
              <p className="text-sm font-medium">
                {points.length
                  ? "В этом дне нет привязанных точек"
                  : "В поездке пока нет точек"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {points.length
                  ? "Покажите все дни на карте или добавьте события, чтобы привязать точки к выбранному дню."
                  : "Начните с точки маршрута, затем добавьте события и перемещения."}
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {points.length > 0 && (
                  <Button className="h-10" onClick={() => setShowAll(true)}>
                    Все дни
                  </Button>
                )}
                <Button
                  variant={points.length > 0 ? "outline" : "default"}
                  className="h-10"
                  onClick={() => {
                    if (points.length === 0) {
                      openPointEditor();
                      return;
                    }
                    setRouteOpen(true);
                    setFeedOpen(false);
                  }}
                >
                  <RouteIcon />
                  {points.length > 0 ? "Открыть маршрут" : "Добавить точку"}
                </Button>
              </div>
            </div>
          </div>
        )}
        <Dialog.Root open={routeOpen} onOpenChange={setRouteOpen}>
          <Dialog.Portal>
            <Dialog.Backdrop className="dialog-backdrop fixed inset-0 z-40 bg-overlay/20" />
            <DialogPopup
              id="route-panel"
              className="dialog-popup fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-background outline-none"
            >
              <div className="flex shrink-0 items-center justify-between border-b px-4 py-3">
                <div>
                  <Dialog.Title className="text-lg font-semibold">
                    Редактор маршрута
                  </Dialog.Title>
                  <Dialog.Description className="mt-0.5 text-xs text-muted-foreground">
                    Точки и перемещения поездки.
                  </Dialog.Description>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-10"
                  aria-label="Закрыть панель маршрута"
                  onClick={() => setRouteOpen(false)}
                >
                  <X />
                </Button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                <RoutePanel
                  points={points}
                  legs={legs}
                  selectedPointId={position.pointId}
                  selectedLegId={position.legId}
                  onSelectPoint={jumpToPoint}
                  onSelectLeg={jumpToLeg}
                  onAddPoint={() => openPointEditor()}
                  onEditPoint={(point) => openPointEditor(point)}
                  onDeletePoint={(point) => {
                    setDeletion({ kind: "point", point });
                  }}
                  onAddLeg={() => setLegEditor({})}
                  onEditLeg={(leg) => setLegEditor({ leg })}
                  onDeleteLeg={(leg) => {
                    setDeletion({ kind: "leg", leg });
                  }}
                />
              </div>
            </DialogPopup>
          </Dialog.Portal>
        </Dialog.Root>
      </section>

      {detailsEvent && (
        <EventDetails
          event={detailsEvent}
          points={points}
          onClose={() => setDetailsEvent(null)}
          onEdit={() => openEventEditor(detailsEvent)}
          onDelete={() => {
            setDetailsEvent(null);
            setDeletion({ kind: "event", event: detailsEvent });
          }}
        />
      )}
      {detailsPoint && (
        <PointDetails
          point={detailsPoint}
          events={events}
          onClose={() => setDetailsPointId(null)}
          onSelectEvent={(event) => {
            setDetailsPointId(null);
            openEvent(event);
          }}
          onAddEvent={() => {
            setDetailsPointId(null);
            openEventEditor(undefined, detailsPoint.id);
          }}
          onEdit={() => openPointEditor(detailsPoint)}
          onDelete={() => {
            setDetailsPointId(null);
            setDeletion({ kind: "point", point: detailsPoint });
          }}
        />
      )}
      {feedOpen && (
        <DayFeed
          items={timeline}
          day={day}
          points={points}
          onClose={() => setFeedOpen(false)}
          onSelectEvent={(event) => {
            setFeedOpen(false);
            openEvent(event);
          }}
          onSelectLeg={(leg) => {
            setFeedOpen(false);
            jumpToLeg(leg.id);
          }}
          onAddEvent={() => {
            setFeedOpen(false);
            openEventEditor();
          }}
        />
      )}
      {eventEditor && (
        <EventForm
          trip={trip}
          event={eventEditor.event}
          day={day}
          time={minutesToTime(minutes)}
          initialPointId={eventEditor.pointId}
          onClose={() => setEventEditor(null)}
          onSave={async (values) => {
            await saveEvent(trip.id, values, eventEditor.event?.id);
            setEventEditor(null);
            setDay(values.start.slice(0, 10));
            setShowAll(false);
            setMinutes(timeToMinutes(values.start));
          }}
        />
      )}
      {pointEditor && (
        <PointForm
          points={points}
          point={pointEditor.point}
          onClose={() => setPointEditor(null)}
          onSave={async (values) => {
            await savePoint(trip.id, values, pointEditor.point?.id);
            setPointEditor(null);
          }}
        />
      )}
      {legEditor && (
        <LegForm
          trip={trip}
          points={points}
          leg={legEditor.leg}
          day={day}
          onClose={() => setLegEditor(null)}
          onSave={async (values) => {
            await saveLeg(trip.id, values, legEditor.leg?.id);
            setLegEditor(null);
            setDay(values.start.slice(0, 10));
            setShowAll(false);
            setMinutes(timeToMinutes(values.start));
          }}
        />
      )}
      <ScheduleCheckDialog
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        events={events}
        legs={legs}
        points={points}
        onShowIssue={showIssue}
      />
      <ConfirmDelete
        open={!!deletion}
        title={deletion ? deletionTitle[deletion.kind] : ""}
        busy={deleting}
        onClose={() => setDeletion(null)}
        onConfirm={confirmDelete}
      >
        {deletion ? deletionText(deletion) : ""}
      </ConfirmDelete>
    </div>
  );
}
