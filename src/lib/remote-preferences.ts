import type { Material } from "@/configs/types/material.type";
import { validateMaterial } from "@/lib/materials";

type Preferences = {
  activeId: string | null;
  materials: Record<string, Material[]>;
};
function key(userId: string) {
  return `travelhub.remote.${userId}`;
}
export function readRemotePreferences(userId: string): Preferences {
  const raw: unknown = JSON.parse(localStorage.getItem(key(userId)) ?? "null");
  const result: Preferences = { activeId: null, materials: {} };
  if (!raw || typeof raw !== "object") return result;
  if ("activeId" in raw && typeof raw.activeId === "string")
    result.activeId = raw.activeId;
  if (
    "materials" in raw &&
    raw.materials &&
    typeof raw.materials === "object"
  ) {
    for (const [id, values] of Object.entries(raw.materials)) {
      if (!Array.isArray(values)) continue;
      result.materials[id] = values.filter((value): value is Material => {
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
