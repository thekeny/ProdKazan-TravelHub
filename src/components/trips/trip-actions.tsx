"use client";
import {
  Download,
  EllipsisVertical,
  ListChecks,
  Pencil,
  TicketPlus,
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
import { useTripOwner } from "@/hooks/use-trip-owner";
import { actionToast } from "@/lib/action-toast";
import { useOnline } from "@/lib/connectivity";
import { useTravel } from "@/providers/travel-provider";
import { TicketImport } from "./ticket-import";
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
  const { exportArchive } = useTravel();
  const isOwner = useTripOwner(trip.id);
  const online = useOnline();
  const [ticketOpen, setTicketOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
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
          <DropdownMenuSeparator />

          <DropdownMenuItem
            disabled={!online}
            onClick={() => {
              setMenuOpen(false);
              setTicketOpen(true);
            }}
          >
            <TicketPlus aria-hidden="true" />
            Импортировать билет
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={exporting || !online}
            onClick={() => {
              if (exporting) return;
              setExporting(true);
              void actionToast(
                () => exportArchive(trip.id),
                "Готовим JSON…",
                "JSON скачан.",
              )
                .catch(() => undefined)
                .finally(() => setExporting(false));
            }}
          >
            <Download aria-hidden="true" />
            Скачать JSON
          </DropdownMenuItem>
          <DropdownMenuSeparator />

          {isOwner && (
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
          )}
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
      {ticketOpen && (
        <TicketImport trip={trip} onClose={() => setTicketOpen(false)} />
      )}
    </div>
  );
}
