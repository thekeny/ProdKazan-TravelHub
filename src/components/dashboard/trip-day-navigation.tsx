import { Button } from "@/components/ui/button";
import { formatDayShort } from "@/lib/travel-format";
export function TripDayNavigation({
  days,
  day,
  showAll,
  onChangeDay,
  onToggleAll,
}: {
  days: string[];
  day: string;
  showAll: boolean;
  onChangeDay: (day: string) => void;
  onToggleAll: () => void;
}) {
  return (
    <div className="mt-2 flex items-center gap-2">
      <div className="flex min-w-0 gap-1.5 overflow-x-auto pb-0.5">
        {days.map((value, index) => {
          const active = day === value && !showAll;
          return (
            <Button
              variant="plain"
              key={value}
              type="button"
              aria-pressed={active}
              className={`min-h-8 shrink-0 rounded-full border px-3 py-1 text-[11px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                active
                  ? "border-primary-strong bg-primary-strong text-primary-foreground"
                  : "border-border bg-surface text-muted-foreground hover:border-primary/50 hover:text-foreground"
              }`}
              onClick={() => onChangeDay(value)}
            >
              <span className="font-medium">День {index + 1}</span>
              <span
                className={`ml-1.5 hidden tabular-nums sm:inline ${active ? "opacity-80" : "opacity-70"}`}
              >
                · {formatDayShort(value)}
              </span>
            </Button>
          );
        })}
      </div>
      <Button
        variant="plain"
        type="button"
        aria-pressed={showAll}
        title="Показать на карте весь маршрут"
        className={`ml-auto min-h-8 shrink-0 rounded-full border px-3 py-1 text-[11px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
          showAll
            ? "border-primary-strong bg-primary-strong text-primary-foreground"
            : "border-border bg-surface text-muted-foreground hover:border-primary/50 hover:text-foreground"
        }`}
        onClick={() => onToggleAll()}
      >
        {showAll ? "Только день" : "Все дни"}
      </Button>
    </div>
  );
}
