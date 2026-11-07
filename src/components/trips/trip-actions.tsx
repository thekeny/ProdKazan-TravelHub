"use client";

import {
  EllipsisVertical,
  ListChecks,
  Pencil,
  Trash2,
  Users,
} from "lucide-react";
import { useState } from "react";
import { TripDeleteConfirmation } from "@/components/trips/trip-delete-confirmation";
import { TripSettings } from "@/components/trips/trip-settings";
import { TripSharing } from "@/components/trips/trip-sharing";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Trip } from "@/configs/types/travel.type";
import { useTripDeletion } from "@/hooks/use-trip-deletion";
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
  const { remote } = useTravel();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [sharingOpen, setSharingOpen] = useState(false);
  const deletion = useTripDeletion(trip.id, onDeleted);

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
              deletion.request();
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
          onDeleted={onDeleted}
        />
      )}

      {sharingOpen && (
        <TripSharing trip={trip} onClose={() => setSharingOpen(false)} />
      )}

      <TripDeleteConfirmation trip={trip} deletion={deletion} />
    </div>
  );
}
