"use client";

import { Dialog } from "@base-ui/react/dialog";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { DialogPopup } from "@/components/ui/dialog-popup";
import type { TripEvent } from "@/configs/types/event.type";
import type { RoutePoint, TripLeg } from "@/configs/types/route.type";
import { findScheduleIssues, type ScheduleIssue } from "@/lib/travel-schedule";

export function ScheduleCheckDialog({
  open,
  onOpenChange,
  events,
  legs,
  points,
  onShowIssue,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  events: readonly TripEvent[];
  legs: readonly TripLeg[];
  points: readonly RoutePoint[];
  onShowIssue?: (issue: ScheduleIssue) => void;
}) {
  const issues = useMemo(
    () => findScheduleIssues(events, legs, points),
    [events, legs, points],
  );
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="dialog-backdrop fixed inset-0 z-50 bg-overlay/35" />
        <DialogPopup className="dialog-popup fixed top-1/2 left-1/2 z-50 flex max-h-[85dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl border bg-background ">
          <header className="flex shrink-0 items-center justify-between gap-3 border-b p-4">
            <div>
              <Dialog.Title className="text-lg font-semibold">
                Проверка расписания
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                {issues.length
                  ? "Это подсказки: проверка не блокирует сохранение."
                  : "События и перемещения не конфликтуют."}
              </Dialog.Description>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-10"
              aria-label="Закрыть проверку расписания"
              onClick={() => onOpenChange(false)}
            >
              <X />
            </Button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {issues.length ? (
              <ul className="grid gap-2">
                {issues.map((issue) => (
                  <li
                    key={issue.id}
                    className="rounded-lg border border-destructive/30 bg-destructive/5 p-3"
                  >
                    <p className="flex items-center gap-1.5 text-sm font-medium text-destructive">
                      <AlertTriangle aria-hidden="true" className="size-4" />
                      {issue.title}
                    </p>
                    <p className="mt-1 break-words text-sm text-muted-foreground">
                      {issue.description}
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {issue.day.split("-").reverse().join(".")}
                      </p>
                      {onShowIssue && (
                        <Button
                          variant="outline"
                          className="h-9"
                          onClick={() => {
                            onOpenChange(false);
                            onShowIssue(issue);
                          }}
                        >
                          Показать
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
                <CheckCircle2
                  aria-hidden="true"
                  className="size-4 text-primary-strong"
                />
                Расписание в порядке.
              </p>
            )}
          </div>
        </DialogPopup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
