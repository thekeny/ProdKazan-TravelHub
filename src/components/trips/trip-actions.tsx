"use client";

import { Dialog } from "@base-ui/react/dialog";
import { EllipsisVertical, ListChecks, Pencil, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { TripForm } from "@/components/trips/trip-form";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Trip, TripValues } from "@/configs/types/travel.type";
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
  const { saveTrip, deleteTrip } = useTravel();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const deletingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (values: TripValues) => {
    saveTrip(trip.id, values);
    setEditorOpen(false);
    onSaved?.();
  };

  const remove = () => {
    if (deletingRef.current) return;
    deletingRef.current = true;
    setDeleting(true);
    setError(null);
    try {
      deleteTrip(trip.id);
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

      <Dialog.Root
        open={editorOpen}
        onOpenChange={setEditorOpen}
        disablePointerDismissal
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-[60] bg-overlay/35" />
          <Dialog.Popup className="fixed inset-3 z-[60] mx-auto max-w-lg overflow-y-auto rounded-xl border bg-background p-5 shadow-xl sm:inset-y-8 sm:p-8">
            <Dialog.Title className="text-xl font-semibold">
              Редактировать путешествие
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-muted-foreground">
              Изменения сразу отразятся на карте и в хронологии.
            </Dialog.Description>
            <div className="mt-6">
              <TripForm
                initial={trip}
                submitLabel="Сохранить изменения"
                onSubmit={save}
                onCancel={() => setEditorOpen(false)}
              />
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={deleteOpen} onOpenChange={setDeleteOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-overlay/35" />
          <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-background p-6 shadow-xl">
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
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
