"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { TripEvent } from "@/configs/types/event.type";
import type { Trip } from "@/configs/types/travel.type";
import { tripDays } from "@/lib/travel-events";
import { todayIso } from "@/lib/travel-format";
import { firstItemMinutes, timeToMinutes } from "@/lib/travel-route";

export function useOverviewNavigation(trip: Trip) {
  const events = trip.events ?? [];
  const legs = trip.legs ?? [];
  const days = useMemo(() => tripDays(trip), [trip]);
  const initializedRef = useRef(false);
  const [day, setDay] = useState(days[0] ?? trip.startDate);
  const [minutes, setMinutes] = useState(() =>
    firstItemMinutes(events, legs, days[0] ?? trip.startDate),
  );
  const [showAll, setShowAll] = useState(false);
  const [detailsEvent, setDetailsEvent] = useState<TripEvent | null>(null);
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    const params = new URLSearchParams(window.location.search);
    const eventId = params.get("event");
    const targetEvent = eventId
      ? events.find((event) => event.id === eventId)
      : undefined;
    if (targetEvent) {
      setDay(targetEvent.start.slice(0, 10));
      setShowAll(false);
      setMinutes(timeToMinutes(targetEvent.start));
      setDetailsEvent(targetEvent);
      return;
    }
    const requestedDay = params.get("day");
    if (requestedDay && days.includes(requestedDay)) {
      setDay(requestedDay);
      setShowAll(false);
      setMinutes(firstItemMinutes(events, legs, requestedDay));
      return;
    }
    const today = todayIso();
    if (days.includes(today)) {
      setDay(today);
      setMinutes(firstItemMinutes(events, legs, today));
    }
  }, [days, events, legs]);

  useEffect(() => {
    if (days.includes(day)) return;
    const next = days[0] ?? trip.startDate;
    setDay(next);
    setMinutes(firstItemMinutes(events, legs, next));
  }, [days, day, events, legs, trip.startDate]);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("day", day);
    if (detailsEvent) url.searchParams.set("event", detailsEvent.id);
    else url.searchParams.delete("event");
    window.history.replaceState(
      null,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }, [day, detailsEvent]);

  function changeDay(value: string) {
    setDay(value);
    setShowAll(false);
    setDetailsEvent(null);
    setMinutes(firstItemMinutes(events, legs, value));
  }

  function openEvent(event: TripEvent) {
    setDay(event.start.slice(0, 10));
    setShowAll(false);
    setMinutes(timeToMinutes(event.start));
    setDetailsEvent(event);
  }

  return {
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
  };
}
