import {
  DOCUMENT_MIME_TYPE,
  MATERIAL_LIMITS,
} from "@/configs/consts/materials.const";
import type { Material, MaterialKind } from "@/configs/types/material.type";
import { createId } from "@/lib/id";
import { compressMaterial } from "@/lib/image";
import { deleteMaterialFiles, putMaterialFile } from "@/lib/material-storage";
import { validateMaterial, validateMaterialInput } from "@/lib/materials";

export async function uploadMaterial(
  file: File,
  kind: MaterialKind,
): Promise<Material> {
  const inputError = validateMaterialInput(file, kind);
  if (inputError) throw new Error(inputError);
  if (kind === "document") {
    const signature = await file.slice(0, 5).text();
    if (signature !== "%PDF-")
      throw new Error("Файл не является корректным PDF.");
  }
  const blob =
    kind === "document"
      ? new Blob([file], { type: DOCUMENT_MIME_TYPE })
      : await compressMaterial(file);
  if (kind === "photo" && blob.size > MATERIAL_LIMITS.MAX_STORED_SIZE)
    throw new Error(
      "После сжатия файл всё ещё слишком большой. Выберите изображение меньше.",
    );
  const id = createId();
  await putMaterialFile(id, blob);
  const material: Material = {
    id,
    name: file.name || "Изображение",
    mimeType: blob.type || file.type,
    size: blob.size,
    kind,
    createdAt: new Date().toISOString(),
  };
  const error = validateMaterial(material);
  if (error) {
    await deleteMaterialFiles([id]);
    throw new Error(error);
  }
  return material;
}
