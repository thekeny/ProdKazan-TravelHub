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
