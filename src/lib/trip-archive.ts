import * as sdk from "@/api/generated/sdk.gen";
import type { TripArchiveInput } from "@/api/generated/types.gen";
import { INTEGRATIONS } from "@/configs/consts/integrations.const";
import { apiId, apiResult } from "@/lib/travel-api";

export async function readTripArchive(file: File): Promise<TripArchiveInput> {
  if (file.size > INTEGRATIONS.archiveBytes)
    throw new Error("Архив должен быть не больше 1 МиБ.");
  let archive: unknown;
  try {
    archive = JSON.parse(await file.text());
  } catch {
    throw new Error("Не удалось прочитать JSON-архив.");
  }
  if (
    typeof archive !== "object" ||
    !archive ||
    !("version" in archive) ||
    archive.version !== 1 ||
    !("trip" in archive) ||
    !("points" in archive) ||
    !Array.isArray(archive.points) ||
    !("events" in archive) ||
    !Array.isArray(archive.events) ||
    !("transfers" in archive) ||
    !Array.isArray(archive.transfers)
  )
    throw new Error("Выберите архив поездки TravelHub версии 1.");
  // The server validates every archive record; preserve the original wire payload.
  return archive as TripArchiveInput;
}

export async function downloadTripArchive(tripId: string) {
  const archive: unknown = await apiResult(
    sdk.tripsGetTripExport({
      path: { trip_id: apiId(tripId) },
      parseAs: "blob",
    }),
  );
  if (!(archive instanceof Blob))
    throw new Error("Не удалось скачать архив поездки.");
  const url = URL.createObjectURL(archive);
  const link = document.createElement("a");
  link.href = url;
  link.download = `trip-${tripId}.json`;
  document.body.append(link);
  try {
    link.click();
  } finally {
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}
