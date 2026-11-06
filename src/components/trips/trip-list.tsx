"use client";

import {
  ArrowRight,
  CalendarDays,
  Map as MapIcon,
  Plus,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DemoNotice } from "@/components/layout/demo-notice";
import { TripActions } from "@/components/trips/trip-actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { StatusToast } from "@/components/ui/status-toast";
import { images } from "@/configs/paths/images.path";
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
      <div
        className={`mt-7 grid gap-4 ${trips.length > 1 ? "sm:grid-cols-2" : ""}`}
      >
        {trips.length ? (
          trips.map((trip) => (
            <article
              key={trip.id}
              className="group relative flex min-h-64 flex-col overflow-hidden rounded-3xl border border-border/70 bg-card transition duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-xl hover:shadow-text/5"
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
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                      style={{ backgroundImage: `url(${trip.cover})` }}
                    />
                  ) : (
                    <span className="absolute inset-0 grid place-items-center">
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 260 120"
                        className="h-full w-full text-primary/25"
                        fill="none"
                      >
                        <path
                          d="M-10 96C42 100 36 33 101 44C166 55 153 103 270 22"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeDasharray="6 8"
                          strokeLinecap="round"
                        />
                        <circle
                          cx="48"
                          cy="91"
                          r="5"
                          fill="var(--surface)"
                          stroke="currentColor"
                          strokeWidth="3"
                        />
                        <circle
                          cx="201"
                          cy="55"
                          r="5"
                          fill="var(--surface)"
                          stroke="currentColor"
                          strokeWidth="3"
                        />
                      </svg>
                      <MapIcon
                        aria-hidden="true"
                        className="absolute size-8 text-primary/50"
                      />
                    </span>
                  )}
                  {trip.isDemo && (
                    <span className="absolute left-3 top-3 rounded-full bg-surface/90 px-2.5 py-1 text-[10px] font-semibold text-primary-strong shadow-sm backdrop-blur">
                      Демо
                    </span>
                  )}
                </span>

                <span className="flex flex-1 flex-col p-4">
                  <span className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
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
                    <ArrowRight
                      aria-hidden="true"
                      className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                    />
                  </span>
                </span>
              </button>
              <div className="absolute right-2 top-2 rounded-full bg-surface/85 shadow-sm backdrop-blur">
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
              Создайте первое путешествие или загрузите готовую демо-поездку,
              чтобы посмотреть, как всё устроено.
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
        className={buttonVariants({
          className: "mt-6 h-12 w-full text-base",
        })}
      >
        <Plus />
        Создать путешествие
      </Link>
      <DemoNotice className="mt-5" />
      <StatusToast message={status} onClose={() => setStatus(null)} />
    </>
  );
}
