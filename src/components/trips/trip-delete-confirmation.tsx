"use client";

import { ConfirmDelete } from "@/components/ui/confirm-delete";
import type { Trip } from "@/configs/types/travel.type";
import type { useTripDeletion } from "@/hooks/use-trip-deletion";

export function TripDeleteConfirmation({
  trip,
  deletion,
}: {
  trip: Trip;
  deletion: ReturnType<typeof useTripDeletion>;
}) {
  return (
    <ConfirmDelete
      open={deletion.open}
      title="Удалить путешествие?"
      busy={deletion.pending}
      onClose={deletion.close}
      onConfirm={deletion.remove}
    >
      «{trip.name}» будет удалено вместе с точками, перемещениями, событиями и
      материалами. Действие нельзя отменить.
    </ConfirmDelete>
  );
}
