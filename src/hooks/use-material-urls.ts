"use client";

import { useEffect, useMemo, useState } from "react";
import type { Material } from "@/configs/types/material.type";
import { getMaterialFile } from "@/lib/material-storage";

export type MaterialUrls = Record<string, string | null>;

/** Загружает файлы материалов из IndexedDB и отдаёт blob-URL для показа. */
export function useMaterialUrls(materials: readonly Material[]): MaterialUrls {
  const key = useMemo(
    () => materials.map((material) => material.id).join("|"),
    [materials],
  );
  const [urls, setUrls] = useState<MaterialUrls>({});

  // Список материалов идентифицируется стабильным ключом из id.
  // biome-ignore lint/correctness/useExhaustiveDependencies: materials меняет ссылку при каждом обновлении состояния.
  useEffect(() => {
    let cancelled = false;
    const created: string[] = [];
    setUrls({});
    Promise.all(
      materials.map(async (material) => {
        try {
          const blob = await getMaterialFile(material.id);
          if (!blob || cancelled) return [material.id, null] as const;
          const url = URL.createObjectURL(blob);
          created.push(url);
          return [material.id, url] as const;
        } catch {
          return [material.id, null] as const;
        }
      }),
    ).then((entries) => {
      if (cancelled) return;
      setUrls(Object.fromEntries(entries));
    });
    return () => {
      cancelled = true;
      for (const url of created) URL.revokeObjectURL(url);
    };
  }, [key]);

  return urls;
}
