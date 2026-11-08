import { API_BASE } from "@/configs/paths/backend.path";
import { sessionFetch } from "@/lib/api-session";

function fileUrl(id: string) {
  return `${API_BASE}/files/${encodeURIComponent(id)}`;
}

export async function putRemoteFile(id: string, blob: Blob): Promise<void> {
  const response = await sessionFetch(fileUrl(id), {
    method: "PUT",
    body: blob,
    headers: { "Content-Type": blob.type || "application/octet-stream" },
  });
  if (!response.ok)
    throw new Error(
      response.status === 413
        ? "Файл слишком большой."
        : "Не удалось загрузить файл.",
    );
}

export async function getRemoteFile(id: string): Promise<Blob | null> {
  const response = await sessionFetch(fileUrl(id));
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Не удалось загрузить файл.");
  return response.blob();
}
