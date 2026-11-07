"use client";

import {
  EllipsisVertical,
  ListChecks,
  Pencil,
  Trash2,
  Users,
} from "lucide-react";
import { useRef, useState } from "react";
import { TripSettings } from "@/components/trips/trip-settings";
import { TripSharing } from "@/components/trips/trip-sharing";
import { Button } from "@/components/ui/button";
import { ConfirmDelete } from "@/components/ui/confirm-delete";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Trip } from "@/configs/types/travel.type";
import { actionToast } from "@/lib/action-toast";
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
  const { deleteTrip, remote } = useTravel();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [sharingOpen, setSharingOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const deletingRef = useRef(false);

  const remove = async () => {
    if (deletingRef.current) return;
    deletingRef.current = true;
    setDeleting(true);
    try {
      await actionToast(
        () => deleteTrip(trip.id),
        "Удаляем путешествие…",
        "Путешествие удалено.",
      );
      setDeleteOpen(false);
      onDeleted?.();
    } catch {
      deletingRef.current = false;
      setDeleting(false);
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
          {remote && (
            <DropdownMenuItem
              className="min-h-10 cursor-pointer px-3"
              onClick={() => {
                setMenuOpen(false);
                setSharingOpen(true);
              }}
            >
              <Users />
              Совместный доступ
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            className="min-h-10 cursor-pointer px-3"
            onClick={() => {
              setMenuOpen(false);
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

      {sharingOpen && (
        <TripSharing trip={trip} onClose={() => setSharingOpen(false)} />
      )}

      <ConfirmDelete
        open={deleteOpen}
        title="Удалить путешествие?"
        busy={deleting}
        onClose={() => setDeleteOpen(false)}
        onConfirm={remove}
      >
        «{trip.name}» будет удалено вместе с точками, перемещениями, событиями и
        материалами. Действие нельзя отменить.
      </ConfirmDelete>
    </div>
  );
}
