import {
  DOCUMENT_MIME_TYPE,
  MATERIAL_LIMITS,
  MATERIAL_TYPES,
} from "@/configs/consts/materials.const";
import { TEXT_LIMITS } from "@/configs/consts/validation.const";
import type { Material, MaterialKind } from "@/configs/types/material.type";
import { textError } from "@/lib/input-validation";

const allowedTypes = new Set<string>(MATERIAL_TYPES);

function isAllowedImageType(value: string) {
  return allowedTypes.has(value);
}

export function validateMaterialInput(
  file: File,
  kind: MaterialKind = "photo",
): string | null {
  const nameError = textError(file.name, TEXT_LIMITS.FILE_NAME, true);
  if (nameError) return `Имя файла: ${nameError.toLowerCase()}`;
  if (file.size <= 0) return "Файл пустой.";
  if (kind === "document") {
    if (
      !file.name.toLowerCase().endsWith(".pdf") ||
      (file.type !== DOCUMENT_MIME_TYPE && file.type !== "")
    )
      return "Билеты и документы можно загрузить только в формате PDF.";
    if (file.size > MATERIAL_LIMITS.MAX_DOCUMENT_SIZE)
      return "Файл слишком большой. Выберите PDF до 12 МБ.";
    return null;
  }
  if (!isAllowedImageType(file.type))
    return "Поддерживаются только JPEG, PNG и WebP.";
  if (file.size > MATERIAL_LIMITS.MAX_SOURCE_SIZE)
    return "Файл слишком большой. Выберите изображение до 12 МБ.";
  return null;
}

export function validateBookingUrl(value: string | undefined): string | null {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return null;
  if (trimmed.length > TEXT_LIMITS.URL)
    return `До ${TEXT_LIMITS.URL} символов.`;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:")
      return "Ссылка должна начинаться с http:// или https://.";
  } catch {
    return "Укажите корректную ссылку на билет или бронирование.";
  }
  return null;
}

export function normalizeBookingUrl(value: string | undefined) {
  return (value ?? "").trim();
}

export function validateMaterial(value: Material): string | null {
  if (!value.id) return "Некорректный материал.";
  if (!value.name.trim()) return "У материала должно быть имя файла.";
  const pdf =
    value.kind === "document" && value.mimeType === DOCUMENT_MIME_TYPE;
  if (!isAllowedImageType(value.mimeType) && !pdf)
    return "Неподдерживаемый тип материала.";
  if (
    !Number.isFinite(value.size) ||
    value.size <= 0 ||
    value.size >
      (pdf
        ? MATERIAL_LIMITS.MAX_DOCUMENT_SIZE
        : MATERIAL_LIMITS.MAX_STORED_SIZE)
  )
    return "Некорректный размер материала.";
  if (value.kind !== "photo" && value.kind !== "document")
    return "Некорректный тип материала.";
  if (typeof value.createdAt !== "string" || !value.createdAt)
    return "Некорректная дата материала.";
  return null;
}

export function validateMaterials(
  materials: readonly Material[] | undefined,
): string | null {
  if (!materials) return null;
  if (!Array.isArray(materials)) return "Некорректный список материалов.";
  if (materials.length > MATERIAL_LIMITS.MAX_PER_EVENT)
    return `К событию можно прикрепить не более ${MATERIAL_LIMITS.MAX_PER_EVENT} материалов.`;
  const ids = new Set<string>();
  for (const material of materials) {
    const error = validateMaterial(material);
    if (error) return error;
    if (ids.has(material.id)) return "Материалы не должны повторяться.";
    ids.add(material.id);
  }
  return null;
}
