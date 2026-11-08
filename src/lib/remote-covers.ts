import { COVER_LIMITS, MATERIAL_TYPES } from "@/configs/consts/materials.const";
import { GATEWAY } from "@/configs/paths/gateway.path";
import { readBlobAsDataUrl } from "@/lib/image";
import { getMaterialFile, putMaterialFile } from "@/lib/material-storage";

export function remoteCoverKey(userId: string, tripId: string) {
  return `cover:${userId}:${tripId}`;
}

export function isUploadedCover(cover: string | null): cover is string {
  return Boolean(cover && /^data:image\/(png|jpeg|webp);base64,/.test(cover));
}

export async function saveRemoteCover(
  userId: string,
  tripId: string,
  cover: string,
) {
  const [header, base64] = cover.split(",");
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  const blob = new Blob([bytes], {
    type: header.slice(5, header.indexOf(";")),
  });
  await putMaterialFile(remoteCoverKey(userId, tripId), blob);
}

export async function loadRemoteCover(userId: string, tripId: string) {
  const blob = await getMaterialFile(remoteCoverKey(userId, tripId));
  return blob ? readBlobAsDataUrl(blob) : null;
}

// Browser image requests use the cookie-authenticated proxy with session refresh.
export function serverCoverUrl(cover: string | null): string | null {
  if (!cover) return null;
  const path = cover.replace(
    /^\/(?:api\/v1|api\/backend|gateway\/backend)(?=\/)/,
    "",
  );
  return /^\/trips\/\d+\/cover\/[a-zA-Z0-9._-]+$/.test(path)
    ? `${GATEWAY.backend}${path}`
    : cover;
}
export function isServerCover(cover: string | null): cover is string {
  return Boolean(
    cover?.startsWith(GATEWAY.backend) &&
      /^\/trips\/\d+\/cover\/[a-zA-Z0-9._-]+$/.test(
        cover.slice(GATEWAY.backend.length),
      ),
  );
}
export function coverBlob(cover: string): Blob {
  const [header, base64] = cover.split(",");
  const blob = new Blob(
    [Uint8Array.from(atob(base64), (char) => char.charCodeAt(0))],
    {
      type: header.slice(5, header.indexOf(";")),
    },
  );
  if (
    !MATERIAL_TYPES.some((type) => type === blob.type) ||
    blob.size > COVER_LIMITS.MAX_UPLOAD_SIZE
  )
    throw new Error(
      "Обложка должна быть JPEG, PNG или WebP до 5 МиБ после сжатия.",
    );
  return blob;
}
