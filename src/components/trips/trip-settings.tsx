"use client";
import { Dialog } from "@base-ui/react/dialog";
import { useCallback, useState } from "react";
import { TripForm } from "@/components/trips/trip-form";
import { DialogPopup } from "@/components/ui/dialog-popup";
import type { Trip, TripValues } from "@/configs/types/travel.type";
import { useDiscardConfirmation } from "@/hooks/use-discard-confirmation";
import { useTravel } from "@/providers/travel-provider";
export function TripSettings({
  trip,
  onClose,
  onSaved,
}: {
  trip: Trip;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const { saveTrip, remote } = useTravel();
  const [values, setValues] = useState<TripValues>(() => ({
    name: trip.name,
    description: trip.description,
    startDate: trip.startDate,
    endDate: trip.endDate,
    cover: trip.cover,
  }));
  const [busy, setBusy] = useState(false);
  const changed = useCallback((next: TripValues, pending: boolean) => {
    setValues(next);
    setBusy(pending);
  }, []);
  const { requestClose, confirmation } = useDiscardConfirmation(
    values,
    onClose,
    busy,
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
        <DialogPopup className="dialog-popup fixed inset-3 z-[60] mx-auto max-w-lg overflow-y-auto rounded-xl border bg-background p-5 sm:inset-y-8 sm:p-8">
          <Dialog.Title className="pr-10 text-xl">
            Настройки путешествия
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-muted-foreground">
            Название, даты, описание и обложка поездки.
          </Dialog.Description>
          <div className="mt-6">
            <TripForm
              remote={remote}
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
          </div>
        </DialogPopup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
