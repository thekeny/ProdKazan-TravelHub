"use client";

import { ExternalLink, FileText, Images, MapPin } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { DemoNotice } from "@/components/layout/demo-notice";
import { StorageWarning } from "@/components/layout/storage-warning";
import { MaterialGrid } from "@/components/materials/material-grid";
import { buttonVariants } from "@/components/ui/button";
import { pages } from "@/configs/paths/pages.path";
import type { Material, MaterialKind } from "@/configs/types/material.type";
import { formatDayLabel } from "@/lib/travel-format";
import { useTravel } from "@/providers/travel-provider";

function EmptyState({ kind, isDemo }: { kind: MaterialKind; isDemo: boolean }) {
  const Icon = kind === "photo" ? Images : FileText;
  return (
    <div className="rounded-xl border border-dashed p-8 text-center">
      <Icon className="mx-auto size-6 text-muted-foreground" />
      <p className="mt-3 text-sm font-medium">
        {kind === "photo"
          ? "Фотографий пока нет"
          : "Билетов и документов пока нет"}
      </p>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
        {kind === "photo"
          ? "Откройте событие и прикрепите фотографии."
          : "Откройте событие и прикрепите изображение билета или брони."}
        {isDemo &&
          " В демо-поездке файлов нет — начните с «Экскурсии по Кремлю»."}
      </p>
      <Link
        href={pages.DASHBOARD}
        className={buttonVariants({ className: "mt-4 h-11" })}
      >
        Открыть обзор
      </Link>
    </div>
  );
}

export function TripGallery({ kind }: { kind: MaterialKind }) {
  const { trips, activeId } = useTravel();
  const trip = trips.find((item) => item.id === activeId);
  const groups = useMemo(() => {
    if (!trip) return [];
    const byDay = new Map<
      string,
      {
        eventId: string;
        day: string;
        title: string;
        start: string;
        point: string;
        materials: Material[];
      }[]
    >();
    const events = [...(trip.events ?? [])].sort(
      (a, b) => a.start.localeCompare(b.start) || a.id.localeCompare(b.id),
    );
    for (const event of events) {
      const materials = event.materials.filter(
        (material) => material.kind === kind,
      );
      if (!materials.length) continue;
      const day = event.start.slice(0, 10);
      const point =
        (trip.points ?? []).find((item) => item.id === event.pointId)?.name ??
        "Без места на карте";
      const list = byDay.get(day) ?? [];
      list.push({
        eventId: event.id,
        day,
        title: event.title,
        start: event.start,
        point,
        materials,
      });
      byDay.set(day, list);
    }
    return Array.from(byDay.entries());
  }, [trip, kind]);
  const bookingLinks = useMemo(
    () =>
      kind === "document"
        ? [...(trip?.events ?? [])]
            .filter((event) => event.bookingUrl)
            .sort(
              (a, b) =>
                a.start.localeCompare(b.start) || a.id.localeCompare(b.id),
            )
        : [],
    [trip, kind],
  );

  if (!trip) return null;
  const title = kind === "photo" ? "Галерея поездки" : "Билеты и документы";
  const description =
    kind === "photo"
      ? "Все фотографии, сгруппированные по дням и событиям."
      : "Изображения билетов, бронирований и ссылки на подтверждения.";

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto max-w-5xl p-4 sm:p-6">
        <header className="mb-6">
          <p className="text-xs text-muted-foreground">{trip.name}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </header>
        <DemoNotice className="mb-6" />
        <StorageWarning className="mb-6" />
        {bookingLinks.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold">Ссылки на билеты и брони</h2>
            <ul className="mt-3 grid gap-2">
              {bookingLinks.map((event) => (
                <li
                  key={event.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-3"
                >
                  <div className="min-w-0">
                    <p className="break-words font-medium">{event.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDayLabel(event.start.slice(0, 10))} ·{" "}
                      {event.start.slice(11, 16)}
                    </p>
                  </div>
                  <a
                    href={event.bookingUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className={buttonVariants({
                      variant: "outline",
                      className: "h-10 shrink-0",
                    })}
                  >
                    <ExternalLink />
                    Открыть
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
        {groups.length ? (
          <div className="grid gap-8">
            {groups.map(([day, entries]) => (
              <section key={day}>
                <h2 className="text-lg font-semibold first-letter:uppercase">
                  {formatDayLabel(day)}
                </h2>
                <div className="mt-3 grid gap-3">
                  {entries.map((entry) => (
                    <article
                      key={`${entry.eventId}-${entry.materials[0].id}`}
                      className="rounded-xl border bg-card p-4"
                    >
                      <header className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-medium break-words [overflow-wrap:anywhere]">
                            <Link
                              href={`${pages.DASHBOARD}?day=${entry.day}&event=${entry.eventId}`}
                              className="underline-offset-4 hover:underline"
                            >
                              {entry.title}
                            </Link>
                          </h3>
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin aria-hidden="true" className="size-3.5" />
                            {entry.point}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground tabular-nums">
                          {entry.start.slice(11, 16)}
                        </p>
                      </header>
                      <MaterialGrid materials={entry.materials} />
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          bookingLinks.length === 0 && (
            <EmptyState kind={kind} isDemo={Boolean(trip.isDemo)} />
          )
        )}
      </div>
    </div>
  );
}
