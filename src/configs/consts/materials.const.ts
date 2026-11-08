export const MATERIAL_KINDS = {
  photo: "Фотография",
  document: "Билет или документ",
} as const;

export const MATERIAL_TABS = [
  { value: "photo", label: "Фото" },
  { value: "document", label: "Билеты и документы" },
] as const;

export const MATERIAL_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const MATERIAL_LIMITS = {
  MAX_DOCUMENT_SIZE: 12 * 1024 * 1024,
  MAX_PER_TRIP: 100,
  MAX_SOURCE_SIZE: 12 * 1024 * 1024,
  MAX_STORED_SIZE: 2 * 1024 * 1024,
  MAX_DIMENSION: 1600,
  MAX_PER_EVENT: 20,
} as const;

export const COVER_LIMITS = {
  MAX_UPLOAD_SIZE: 5 * 1024 * 1024,
  MAX_SOURCE_SIZE: 12 * 1024 * 1024,
  MAX_STORED_SIZE: 1024 * 1024,
  MAX_DIMENSION: 1600,
} as const;

export const MATERIAL_ACCEPT = MATERIAL_TYPES.join(",");
export const DOCUMENT_MIME_TYPE = "application/pdf";
export const DOCUMENT_ACCEPT = ".pdf,application/pdf";
export const PDF_PREVIEW = { MAX_WIDTH: 600, MAX_HEIGHT: 900 } as const;
