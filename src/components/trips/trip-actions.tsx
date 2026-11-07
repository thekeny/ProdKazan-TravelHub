"use client";

import { Dialog } from "@base-ui/react/dialog";
import { EllipsisVertical, ListChecks, Pencil, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { TripSettings } from "@/components/trips/trip-settings";
import { Button } from "@/components/ui/button";
import { DialogPopup } from "@/components/ui/dialog-popup";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Trip } from "@/configs/types/travel.type";
import { useTravel } from "@/providers/travel-provider";

export function TripActions({
  trip,
  onSaved,
  onDeleted,
  onCheckSchedule,
}: {
  trip: Trip;
  onSaved?: () => void;
  onDeleted?: () => void;
  onCheckSchedule?: () => void;
}) {
  const { deleteTrip } = useTravel();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const deletingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  const remove = async () => {
    if (deletingRef.current) return;
    deletingRef.current = true;
    setDeleting(true);
    setError(null);
    try {
      await deleteTrip(trip.id);
      setDeleteOpen(false);
      onDeleted?.();
    } catch (deleteError) {
      deletingRef.current = false;
      setDeleting(false);
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Не удалось удалить путешествие.",
      );
    }
  };

  return (
    <div className="shrink-0">
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="size-10"
              aria-label={`Действия с путешествием «${trip.name}»`}
            />
          }
        >
          <EllipsisVertical />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem
            className="min-h-10 cursor-pointer px-3"
            onClick={() => {
              setMenuOpen(false);
              setEditorOpen(true);
            }}
          >
            <Pencil />
            Редактировать поездку
          </DropdownMenuItem>
          {onCheckSchedule && (
            <DropdownMenuItem
              className="min-h-10 cursor-pointer px-3"
              onClick={() => {
                setMenuOpen(false);
                onCheckSchedule();
              }}
            >
              <ListChecks />
              Проверить расписание
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            className="min-h-10 cursor-pointer px-3"
            onClick={() => {
              setMenuOpen(false);
              setError(null);
              setDeleteOpen(true);
            }}
          >
            <Trash2 />
            Удалить поездку
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {editorOpen && (
        <TripSettings
          trip={trip}
          onClose={() => setEditorOpen(false)}
          onSaved={onSaved}
        />
      )}

      <Dialog.Root
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!deletingRef.current) setDeleteOpen(open);
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="dialog-backdrop fixed inset-0 z-50 bg-overlay/35" />
          <DialogPopup className="dialog-popup fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-background p-6 ">
            <Dialog.Title className="text-lg font-semibold">
              Удалить путешествие?
            </Dialog.Title>
            <Dialog.Description className="mt-2 break-words text-sm text-muted-foreground">
              «{trip.name}» будет удалено вместе с точками, перемещениями,
              событиями и материалами. Действие нельзя отменить.
            </Dialog.Description>
            {error && (
              <p role="alert" className="mt-3 text-sm text-destructive">
                {error}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                className="h-11"
                disabled={deleting}
                onClick={() => setDeleteOpen(false)}
              >
                Отмена
              </Button>
              <Button
                variant="destructive"
                className="h-11"
                disabled={deleting}
                onClick={remove}
              >
                {deleting ? "Удаляем…" : "Удалить"}
              </Button>
            </div>
          </DialogPopup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
