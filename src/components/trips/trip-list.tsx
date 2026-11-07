"use client";

import { ArrowRight, CalendarDays, Map as MapIcon, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TripActions } from "@/components/trips/trip-actions";
import { TripRouteSketch } from "@/components/trips/trip-route-sketch";
import { buttonVariants } from "@/components/ui/button";
import { StatusToast } from "@/components/ui/status-toast";
import { images } from "@/configs/paths/images.path";
import { pages } from "@/configs/paths/pages.path";
import { formatTripDates } from "@/lib/travel-format";
import { useTravel } from "@/providers/travel-provider";

export function TripList() {
  const { trips, selectTrip } = useTravel();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  return (
    <>
      <div
        className={`mt-7 grid gap-4 ${trips.length > 1 ? "sm:grid-cols-2" : ""}`}
      >
        {trips.length ? (
          trips.map((trip) => (
            <article
              key={trip.id}
              className="relative flex min-h-64 flex-col overflow-hidden rounded-3xl border border-border! bg-card transition-colors duration-150 hover:border-primary/60! hover:bg-secondary/20"
            >
              <button
                type="button"
                className="flex min-w-0 flex-1 flex-col text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                onClick={() => {
                  try {
                    selectTrip(trip.id);
                    router.push(pages.DASHBOARD);
                  } catch (selectError) {
                    setError((selectError as Error).message);
                  }
                }}
              >
                <span className="relative block h-32 shrink-0 overflow-hidden bg-secondary/40 paper-texture">
                  {trip.cover ? (
                    <span
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${trip.cover})` }}
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
                  <span className="mt-2 line-clamp-2 break-words font-display text-xl leading-tight [overflow-wrap:anywhere]">
                    {trip.name}
                  </span>
                  {trip.description && (
                    <span className="mt-1.5 line-clamp-2 text-sm leading-6 text-muted-foreground">
                      {trip.description}
                    </span>
                  )}
                  <span className="mt-auto inline-flex items-center gap-1 pt-3 text-sm font-medium text-primary-strong">
                    Открыть
                    <ArrowRight aria-hidden="true" className="size-3.5" />
                  </span>
                </span>
              </button>
              <div className="absolute right-2 top-2 rounded-full bg-surface/85  backdrop-blur">
                <TripActions
                  trip={trip}
                  onSaved={() => setStatus(`Поездка «${trip.name}» обновлена.`)}
                  onDeleted={() => setStatus(`Поездка «${trip.name}» удалена.`)}
                />
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-border px-5 py-10 text-center sm:col-span-2">
            <Image
              src={images.ICON}
              alt=""
              width={658}
              height={658}
              sizes="64px"
              className="mx-auto size-16 rotate-3"
            />
            <p className="mt-4 font-display text-2xl">Пока нет путешествий</p>
            <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
              Создайте первую поездку, чтобы начать планировать маршрут.
            </p>
          </div>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {error}
        </p>
      )}
      <Link
        href={pages.NEW_TRIP}
        className={buttonVariants({
          className: "mt-6 h-12 w-full text-base",
        })}
      >
        <Plus />
        Создать путешествие
      </Link>
      <StatusToast message={status} onClose={() => setStatus(null)} />
    </>
  );
}
