"use client";
import { Check, ChevronsUpDown, Plus, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TripSettings } from "@/components/trips/trip-settings";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusToast } from "@/components/ui/status-toast";
import { pages } from "@/configs/paths/pages.path";
import { formatTripDates } from "@/lib/travel-format";
import { useTravel } from "@/providers/travel-provider";

const itemClassName =
  "min-h-14 w-full cursor-pointer rounded-md px-3 py-2.5 transition-colors duration-150 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground";

export function TripSwitcher({
  onNavigate,
  compact = false,
}: {
  onNavigate?: () => void;
  compact?: boolean;
}) {
  const { trips, activeId, selectTrip } = useTravel();
  const router = useRouter();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const active = trips.find((trip) => trip.id === activeId);

  const handleSelect = (value: string) => {
    try {
      selectTrip(value);
      setError(null);
      onNavigate?.();
    } catch (error) {
      setError((error as Error).message);
    }
    setOpen(false);
  };

  return (
    <div className={compact ? "" : "mt-8"}>
      <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
        <DropdownMenuTrigger
          className={`group flex w-full items-center gap-3 rounded-lg bg-muted p-3 text-left outline-none transition-colors duration-150 hover:bg-accent data-[popup-open]:bg-accent focus-visible:ring-2 focus-visible:ring-ring ${compact ? "min-h-12" : "min-h-16"}`}
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">
              {active?.name}
            </span>
            {!compact && (
              <span className="mt-1 block truncate text-[11px] text-muted-foreground">
                {active && formatTripDates(active)}
              </span>
            )}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 transition-transform duration-200 group-data-[popup-open]:rotate-180" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align={compact ? "end" : "start"}
          sideOffset={8}
          className="max-h-[60dvh] w-64 max-w-[calc(100vw-2rem)] p-2"
        >
          <p className="px-3 pt-2 pb-1 text-[11px] text-muted-foreground">
            Ваши путешествия
          </p>
          <DropdownMenuRadioGroup
            value={activeId ?? ""}
            onValueChange={(value) => handleSelect(value as string)}
            className="flex flex-col gap-0.5"
          >
            {trips.map((trip) => (
              <DropdownMenuRadioItem
                key={trip.id}
                value={trip.id}
                closeOnClick={false}
                className={itemClassName}
              >
                <span className="min-w-0 flex-1 pr-6">
                  <span className="flex items-center gap-2">
                    <span className="min-w-0 truncate font-medium">
                      {trip.name}
                    </span>
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                    {formatTripDates(trip)}
                  </span>
                </span>
                {trip.id === activeId && (
                  <Check className="absolute right-3 size-4" />
                )}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              onNavigate?.();
              router.push(pages.NEW_TRIP);
            }}
            className={itemClassName}
          >
            <Plus className="size-4 shrink-0" />
            Создать путешествие
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setOpen(false);
              setSettingsOpen(true);
            }}
            className={itemClassName}
          >
            <Settings className="size-4 shrink-0" />
            Настройки путешествия
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {settingsOpen && active && (
        <TripSettings
          key={active.id}
          trip={active}
          onClose={() => setSettingsOpen(false)}
          onSaved={() => setStatus("Путешествие обновлено.")}
        />
      )}
      <StatusToast message={status} onClose={() => setStatus(null)} />
      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
