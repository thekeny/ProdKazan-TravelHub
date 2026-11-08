"use client";
import { Dialog } from "@base-ui/react/dialog";
import { Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import { TripDeleteConfirmation } from "@/components/trips/trip-delete-confirmation";
import { TripForm } from "@/components/trips/trip-form";
import { Button } from "@/components/ui/button";
import { DialogPopup } from "@/components/ui/dialog-popup";
import type { Trip, TripValues } from "@/configs/types/travel.type";
import { useDiscardConfirmation } from "@/hooks/use-discard-confirmation";
import { useTripDeletion } from "@/hooks/use-trip-deletion";
import { useTripOwner } from "@/hooks/use-trip-owner";
import { useTravel } from "@/providers/travel-provider";
export function TripSettings({
  trip,
  onClose,
  onSaved,
  onDeleted,
}: {
  trip: Trip;
  onClose: () => void;
  onSaved?: () => void;
  onDeleted?: () => void;
}) {
  const { saveTrip } = useTravel();
  const isOwner = useTripOwner(trip.id);
  const deletion = useTripDeletion(trip.id, () => {
    onDeleted?.();
    onClose();
  });
  const [values, setValues] = useState<TripValues>(() => ({
    name: trip.name,
    description: trip.description,
    startDate: trip.startDate,
    endDate: trip.endDate,
    cover: trip.cover,
    eventTypes: trip.eventTypes ?? [],
  }));
  const [busy, setBusy] = useState(false);
  const [typeDraft, setTypeDraft] = useState("");
  const changed = useCallback(
    (next: TripValues, pending: boolean, draft: string) => {
      setValues(next);
      setBusy(pending);
      setTypeDraft(draft);
    },
    [],
  );
  const { requestClose, confirmation } = useDiscardConfirmation(
    { values, typeDraft },
    onClose,
    busy || deletion.pending,
  );
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) requestClose();
      }}
    >
      {confirmation}
      <Dialog.Portal>
        <Dialog.Backdrop className="dialog-backdrop fixed inset-0 z-[60] bg-overlay/35" />
        <DialogPopup className="dialog-popup fixed inset-3 z-[60] mx-auto max-w-3xl overflow-y-auto rounded-xl border bg-background p-5 sm:inset-y-8 sm:p-8">
          <Dialog.Title className="pr-10 text-xl">
            Настройки путешествия
          </Dialog.Title>
          <fieldset disabled={deletion.pending} className="mt-6 min-w-0">
            <TripForm
              initial={trip}
              submitLabel="Сохранить изменения"
              onStateChange={changed}
              onCancel={requestClose}
              onSubmit={async (next) => {
                await saveTrip(trip.id, next);
                onSaved?.();
                onClose();
              }}
            />
          </fieldset>
          {isOwner && (
            <div className="mt-8 border-t pt-5">
              <Button
                type="button"
                variant="ghost"
                className="min-h-11 text-destructive hover:bg-destructive/10 hover:text-destructive"
                disabled={busy || deletion.pending}
                onClick={deletion.request}
              >
                <Trash2 aria-hidden="true" />
                Удалить путешествие
              </Button>
            </div>
          )}
          <TripDeleteConfirmation trip={trip} deletion={deletion} />
        </DialogPopup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
