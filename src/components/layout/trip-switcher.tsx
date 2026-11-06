"use client";
import { Menu } from "@base-ui/react/menu";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { pages } from "@/configs/paths/pages.path";
import { formatTripDates } from "@/lib/travel-format";
import { useTravel } from "@/providers/travel-provider";
export function TripSwitcher() {
  const { trips, activeId, selectTrip } = useTravel();
  const [error, setError] = useState<string | null>(null);
  const active = trips.find((trip) => trip.id === activeId);
  return (
    <div className="mt-8">
      <Menu.Root>
        <Menu.Trigger className="flex min-h-16 w-full items-center gap-3 rounded-lg bg-muted p-3 text-left outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring">
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">
              {active?.name}
            </span>
            <span className="mt-1 block text-xs text-muted-foreground">
              {active && formatTripDates(active)}
            </span>
          </span>
          <ChevronsUpDown className="size-4 shrink-0" />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner sideOffset={8} align="start" className="z-50">
            <Menu.Popup className="max-h-[60dvh] w-[var(--anchor-width)] min-w-56 overflow-y-auto rounded-lg border bg-popover p-1.5 shadow-lg outline-none">
              <p className="px-3 py-2 text-xs text-muted-foreground">
                Ваши путешествия
              </p>
              {trips.map((trip) => (
                <Menu.Item
                  key={trip.id}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-3 text-sm outline-none data-highlighted:bg-muted"
                  onClick={() => {
                    try {
                      selectTrip(trip.id);
                      setError(null);
                    } catch (error) {
                      setError((error as Error).message);
                    }
                  }}
                >
                  <span className="min-w-0 flex-1 break-words [overflow-wrap:anywhere]">
                    {trip.name}
                  </span>
                  {trip.id === activeId && (
                    <Check className="size-4 shrink-0" />
                  )}
                </Menu.Item>
              ))}
              <Menu.Separator className="my-1 h-px bg-border" />
              <Menu.Item
                render={<Link href={pages.TRIPS} />}
                className="block rounded-md px-3 py-3 text-sm outline-none data-highlighted:bg-muted"
              >
                Все путешествия
              </Menu.Item>
              <Menu.Item
                render={<Link href={pages.NEW_TRIP} />}
                className="flex items-center gap-2 rounded-md px-3 py-3 text-sm outline-none data-highlighted:bg-muted"
              >
                <Plus className="size-4" />
                Создать путешествие
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
