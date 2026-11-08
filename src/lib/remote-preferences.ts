import type { Material } from "@/configs/types/material.type";
import { eventTypesError } from "@/lib/event-types";
import { validateMaterial } from "@/lib/materials";

type Preferences = {
  activeId: string | null;
  materials: Record<string, Material[]>;
  tripMaterials?: Record<string, Material[]>;
  coverIds?: string[];
  // TODO API: custom event types are local until the backend supports them.
  eventTypes?: Record<string, string | null>;
  tripEventTypes?: Record<string, string[]>;
};
function key(userId: string) {
  return `travelhub.remote.${userId}`;
}
export function removeRemotePreferences(userId: string) {
  localStorage.removeItem(key(userId));
}
export function readRemotePreferences(userId: string): Preferences {
  const raw: unknown = JSON.parse(localStorage.getItem(key(userId)) ?? "null");
  const result: Preferences = { activeId: null, materials: {} };
  if (!raw || typeof raw !== "object") return result;
  if (
    "eventTypes" in raw &&
    raw.eventTypes &&
    typeof raw.eventTypes === "object"
  ) {
    result.eventTypes = {};
    for (const [id, type] of Object.entries(raw.eventTypes)) {
      if (
        type === null ||
        (typeof type === "string" && !eventTypesError([type]))
      )
        result.eventTypes[id] = type;
    }
  }
  if (
    "tripEventTypes" in raw &&
    raw.tripEventTypes &&
    typeof raw.tripEventTypes === "object"
  ) {
    result.tripEventTypes = {};
    for (const [id, types] of Object.entries(raw.tripEventTypes)) {
      if (Array.isArray(types) && !eventTypesError(types))
        result.tripEventTypes[id] = types;
    }
  }
  if ("activeId" in raw && typeof raw.activeId === "string")
    result.activeId = raw.activeId;
  if ("coverIds" in raw && Array.isArray(raw.coverIds))
    result.coverIds = raw.coverIds.filter(
      (id): id is string => typeof id === "string",
    );
  for (const field of ["materials", "tripMaterials"] as const) {
    const stored =
      field === "materials"
        ? "materials" in raw
          ? raw.materials
          : undefined
        : "tripMaterials" in raw
          ? raw.tripMaterials
          : undefined;
    if (!stored || typeof stored !== "object") continue;
    const materials: Record<string, Material[]> = {};
    result[field] = materials;
    for (const [id, values] of Object.entries(stored)) {
      if (!Array.isArray(values)) continue;
      materials[id] = values.filter((value): value is Material => {
        if (!value || typeof value !== "object") return false;
        return (
          typeof value.id === "string" &&
          typeof value.name === "string" &&
          typeof value.mimeType === "string" &&
          typeof value.size === "number" &&
          typeof value.createdAt === "string" &&
          ["photo", "document"].includes(value.kind) &&
          !validateMaterial(value)
        );
      });
    }
  }
  return result;
}
export function writeRemotePreferences(userId: string, value: Preferences) {
  localStorage.setItem(key(userId), JSON.stringify(value));
}
