"use client";
import { ChevronRight, Map as MapIcon, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/layout/logo";
import { Button, buttonVariants } from "@/components/ui/button";
import { pages } from "@/configs/paths/pages.path";
import { formatTripDates } from "@/lib/travel-format";
import { useTravel } from "@/providers/travel-provider";
export default function Page() {
  const { trips, selectTrip, logout } = useTravel();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  return (
    <main className="flow-background">
      <section className="flow-card">
        <Logo />
        <h1 className="mt-9 text-3xl font-semibold tracking-tight">
          Ваши путешествия
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Выберите путешествие или создайте новое.
        </p>
        <div className="mt-7 grid gap-3">
          {trips.length ? (
            trips.map((trip) => (
              <Button
                key={trip.id}
                variant="outline"
                className="group h-auto min-h-20 justify-start gap-3 border-transparent bg-muted p-3 text-left whitespace-normal transition-colors duration-150 hover:border-border hover:bg-accent hover:text-accent-foreground"
                onClick={() => {
                  try {
                    selectTrip(trip.id);
                    router.push(pages.DASHBOARD);
                  } catch (error) {
                    setError((error as Error).message);
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
                  <span className="block break-words font-semibold [overflow-wrap:anywhere]">
                    {trip.name}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {formatTripDates(trip)}
                  </span>
                </span>
                <ChevronRight className="size-4 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5" />
              </Button>
            ))
          ) : (
            <div className="rounded-lg border border-dashed px-5 py-8 text-center">
              <MapIcon className="mx-auto size-6 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium">Пока нет путешествий</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Создайте первое, чтобы начать.
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
          className={buttonVariants({ className: "mt-6 h-11 w-full" })}
        >
          <Plus />
          Создать путешествие
        </Link>
        <Button
          variant="ghost"
          className="mt-3 h-11 w-full bg-transparent text-muted-foreground hover:bg-muted"
          onClick={() => {
            try {
              logout();
              router.replace(pages.LOGIN);
            } catch (error) {
              setError((error as Error).message);
            }
          }}
        >
          Выйти
        </Button>
      </section>
    </main>
  );
}
