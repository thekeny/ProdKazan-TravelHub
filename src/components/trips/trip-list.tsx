"use client";

import { Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { images } from "@/configs/paths/images.path";
import { pages } from "@/configs/paths/pages.path";
import { useTravel } from "@/providers/travel-provider";
import { ArchiveImport } from "./archive-import";
import { TripCard } from "./trip-card";

export function TripList() {
  const { trips, selectTrip } = useTravel();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <div
        className={`mt-7 grid gap-4 ${trips.length > 1 ? "sm:grid-cols-2" : ""}`}
      >
        {trips.length ? (
          trips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              onSelect={() => {
                try {
                  selectTrip(trip.id);
                  router.push(pages.DASHBOARD);
                } catch (error) {
                  setError(
                    error instanceof Error ? error.message : String(error),
                  );
                }
              }}
            />
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
      <ArchiveImport />
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
    </>
  );
}
