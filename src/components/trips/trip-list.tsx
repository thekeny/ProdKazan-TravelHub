"use client";

import { ChevronRight, Map as MapIcon, Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DemoNotice } from "@/components/layout/demo-notice";
import { TripActions } from "@/components/trips/trip-actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { StatusToast } from "@/components/ui/status-toast";
import { pages } from "@/configs/paths/pages.path";
import { formatTripDates } from "@/lib/travel-format";
import { useTravel } from "@/providers/travel-provider";

export function TripList() {
  const { trips, selectTrip, createDemoTrip } = useTravel();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  return (
    <>
      <div className="mt-7 grid gap-3">
        {trips.length ? (
          trips.map((trip) => (
            <article
              key={trip.id}
              className="flex min-h-20 items-center gap-2 rounded-lg border border-transparent bg-muted p-2 transition-colors hover:border-border hover:bg-accent"
            >
              <button
                type="button"
                className="flex min-h-16 min-w-0 flex-1 items-center gap-3 rounded-lg p-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => {
                  try {
                    selectTrip(trip.id);
                    router.push(pages.DASHBOARD);
                  } catch (selectError) {
                    setError((selectError as Error).message);
                  }
                }}
              >
                {trip.cover ? (
                  <span
                    className="size-12 shrink-0 rounded-md bg-cover bg-center"
                    style={{ backgroundImage: `url(${trip.cover})` }}
                  />
                ) : (
                  <span className="grid size-12 shrink-0 place-items-center rounded-md border bg-surface">
                    <MapIcon className="size-5 text-muted-foreground" />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="block min-w-0 break-words font-semibold [overflow-wrap:anywhere]">
                      {trip.name}
                    </span>
                    {trip.isDemo && (
                      <span className="shrink-0 rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-primary-strong">
                        Демо
                      </span>
                    )}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {formatTripDates(trip)}
                  </span>
                  {trip.description && (
                    <span className="mt-1 line-clamp-1 block text-xs text-muted-foreground">
                      {trip.description}
                    </span>
                  )}
                </span>
                <ChevronRight
                  aria-hidden="true"
                  className="size-4 shrink-0 text-muted-foreground"
                />
              </button>
              <TripActions
                trip={trip}
                onSaved={() => setStatus(`Поездка «${trip.name}» обновлена.`)}
                onDeleted={() => setStatus(`Поездка «${trip.name}» удалена.`)}
              />
            </article>
          ))
        ) : (
          <div className="rounded-lg border border-dashed px-5 py-8 text-center">
            <MapIcon className="mx-auto size-6 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">Пока нет путешествий</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Создайте первое или загрузите готовую демо-поездку.
            </p>
            <Button
              variant="outline"
              className="mt-4 h-11"
              onClick={() => {
                try {
                  createDemoTrip();
                  router.push(pages.DASHBOARD);
                } catch (demoError) {
                  setError((demoError as Error).message);
                }
              }}
            >
              <Sparkles />
              Загрузить демо-поездку
            </Button>
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
        className={buttonVariants({ className: "mt-6 h-11 w-full" })}
      >
        <Plus />
        Создать путешествие
      </Link>
      <DemoNotice className="mt-5" />
      <StatusToast message={status} onClose={() => setStatus(null)} />
    </>
  );
}
