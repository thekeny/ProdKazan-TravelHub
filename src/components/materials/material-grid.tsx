"use client";

import { ImageOff, X } from "lucide-react";
import { useMemo, useState } from "react";
import { MaterialThumbnail } from "@/components/materials/material-thumbnail";
import { Button } from "@/components/ui/button";
import type { Material } from "@/configs/types/material.type";
import { useMaterialUrls } from "@/hooks/use-material-urls";

export function MaterialGrid({
  materials,
  onRemove,
}: {
  materials: readonly Material[];
  onRemove?: (material: Material) => void;
}) {
  const list = useMemo(() => [...materials], [materials]);
  const urls = useMaterialUrls(list);
  const [openId, setOpenId] = useState<string | null>(null);
  const open = list.find((material) => material.id === openId);
  const openUrl = open ? urls[open.id] : null;
  return (
    <>
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {list.map((material) => (
          <li key={material.id} className="min-w-0">
            <MaterialThumbnail
              material={material}
              className="aspect-square w-full"
              onClick={() => setOpenId(material.id)}
            />
            <div className="mt-1 flex items-center gap-1">
              <p className="min-w-0 flex-1 truncate text-[11px] text-muted-foreground">
                {material.name}
              </p>
              {onRemove && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-9 shrink-0 text-destructive"
                  aria-label={`Удалить материал «${material.name}»`}
                  onClick={() => onRemove(material)}
                >
                  <X />
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {open && openUrl && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Просмотр материала «${open.name}»`}
          className="fixed inset-0 z-[60] grid place-items-center bg-overlay/70 p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpenId(null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpenId(null);
          }}
        >
          <div className="max-h-full max-w-4xl overflow-auto rounded-xl border bg-surface p-2 shadow-xl">
            {/* biome-ignore lint/performance/noImgElement: blob-URL из IndexedDB не проходит через оптимизатор Next. */}
            <img
              src={openUrl}
              alt={open.name}
              className="max-h-[80dvh] w-auto rounded-lg object-contain"
            />
            <div className="flex items-center justify-between gap-3 p-2">
              <p className="min-w-0 truncate text-sm">{open.name}</p>
              <Button
                autoFocus
                type="button"
                variant="outline"
                className="h-10"
                onClick={() => setOpenId(null)}
              >
                Закрыть
              </Button>
            </div>
          </div>
        </div>
      )}
      {!list.length && (
        <p className="flex items-center gap-2 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
          <ImageOff aria-hidden="true" className="size-4" />
          Материалов пока нет
        </p>
      )}
    </>
  );
}
