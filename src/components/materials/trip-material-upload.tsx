"use client";

import { useState } from "react";
import { MATERIAL_LIMITS } from "@/configs/consts/materials.const";
import type { MaterialKind } from "@/configs/types/material.type";
import type { Trip } from "@/configs/types/travel.type";
import { useOnline } from "@/lib/connectivity";
import { useTravel } from "@/providers/travel-provider";
import { MaterialUploader } from "./material-uploader";

export function TripMaterialUpload({
  trip,
  kind,
  actions,
}: {
  trip: Trip;
  kind: MaterialKind;
  actions?: React.ReactNode;
}) {
  const { addTripMaterials } = useTravel();
  const online = useOnline();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="grid gap-2">
      <p className="sr-only">
        Материалы сохраняются в поездку без привязки к событию.
      </p>
      <MaterialUploader
        compact
        actions={actions}
        kind={kind}
        remaining={Math.max(
          0,
          MATERIAL_LIMITS.MAX_PER_TRIP - (trip.materials?.length ?? 0),
        )}
        disabled={!online}
        onBatchUploaded={(materials) => addTripMaterials(trip.id, materials)}
        onError={setError}
      />
      <p className="text-xs text-muted-foreground">
        Файлы хранятся только в этом браузере.
      </p>
      {error && (
        <p className="user-text whitespace-pre-line text-xs text-destructive">
          {error}
        </p>
      )}
      {!online && (
        <p className="text-xs text-muted-foreground">
          Загрузка доступна при подключении к сети.
        </p>
      )}
    </div>
  );
}
