"use client";

import { ArrowRight, CalendarDays, Map as MapIcon } from "lucide-react";
import Image from "next/image";
import { TripActions } from "@/components/trips/trip-actions";
import { TripRouteSketch } from "@/components/trips/trip-route-sketch";
import { Button } from "@/components/ui/button";
import type { Trip } from "@/configs/types/travel.type";
import { formatTripDates } from "@/lib/travel-format";
export function TripCard({
  trip,
  onSelect,
}: {
  trip: Trip;
  onSelect: () => void;
}) {
  return (
    <article className="relative flex min-h-64 flex-col overflow-hidden rounded-3xl border border-border! bg-card transition-colors duration-150 hover:border-border! hover:bg-surface-hover">
      <Button
        variant="plain"
        type="button"
        className="flex min-w-0 flex-1 flex-col text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        onClick={onSelect}
      >
        <span className="relative block h-32 shrink-0 overflow-hidden bg-secondary/40 paper-texture">
          {trip.cover ? (
            <Image
              src={trip.cover}
              alt=""
              fill
              unoptimized
              sizes="(min-width: 640px) 50vw, 100vw"
              className="object-cover"
            />
          ) : (
            <>
              <TripRouteSketch
                points={trip.points ?? []}
                className="absolute inset-0 h-full w-full text-primary/55"
              />
              {(trip.points ?? []).length < 2 && (
                <MapIcon
                  aria-hidden="true"
                  className="absolute inset-0 m-auto size-8 text-primary"
                />
              )}
            </>
          )}
        </span>

        <span className="flex flex-1 flex-col p-4">
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <CalendarDays aria-hidden="true" className="size-3.5" />
            {formatTripDates(trip)}
          </span>
          <span className="mt-2 user-text font-sans text-xl leading-tight [overflow-wrap:anywhere]">
            {trip.name}
          </span>
          {trip.description && (
            <span className="mt-1.5 user-text text-sm leading-6 text-muted-foreground whitespace-pre-wrap">
              {trip.description}
            </span>
          )}
          <span className="mt-auto inline-flex items-center gap-1 pt-3 text-sm font-medium text-primary-strong">
            Открыть
            <ArrowRight aria-hidden="true" className="size-3.5" />
          </span>
        </span>
      </Button>
      <div className="absolute right-2 top-2 rounded-full bg-surface/85  backdrop-blur">
        <TripActions trip={trip} />
      </div>
    </article>
  );
}
