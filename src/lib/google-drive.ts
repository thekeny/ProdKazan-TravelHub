import * as sdk from "@/api/generated/sdk.gen";
import { INTEGRATIONS } from "@/configs/consts/integrations.const";
import type { Material } from "@/configs/types/material.type";
import { getMaterialFile } from "@/lib/material-storage";
import { apiResult } from "@/lib/travel-api";

export async function disconnectDriveBeforeDeletion() {
  const status = await apiResult(sdk.googleDriveStatus());
  if (
    !status.enabled ||
    (status.status === "disconnected" && !status.revocationPending)
  )
    return;
  await apiResult(sdk.googleDriveDisconnect());
  const current = await apiResult(sdk.googleDriveStatus());
  if (current.revocationPending || current.status === "connected")
    throw new Error(
      "Не удалось завершить отключение Google Drive. Повторите удаление позже.",
    );
}

export async function drivePhoto(material: Material): Promise<File> {
  const blob = await getMaterialFile(material.id);
  if (!blob) throw new Error("Фото недоступно в этом браузере.");
  const bitmap = await createImageBitmap(blob);
  try {
    if (bitmap.width * bitmap.height > INTEGRATIONS.photoPixels)
      throw new Error("Фото должно содержать не больше 25 млн пикселей.");
    let output = blob;
    let name = material.name;
    if (!["image/jpeg", "image/png"].includes(blob.type)) {
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Не удалось подготовить фото.");
      context.drawImage(bitmap, 0, 0);
      output = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (result) =>
            result
              ? resolve(result)
              : reject(new Error("Не удалось преобразовать фото.")),
          "image/jpeg",
          0.9,
        ),
      );
      name = `${name.replace(/\.[^.]+$/, "")}.jpg`;
    }
    if (output.size > INTEGRATIONS.photoBytes)
      throw new Error("Фото должно быть не больше 10 МБ.");
    return new File([output], name, { type: output.type });
  } finally {
    bitmap.close();
  }
}
