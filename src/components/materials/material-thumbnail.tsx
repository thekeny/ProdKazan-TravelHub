"use client";

import { ImageOff, LoaderCircle } from "lucide-react";
import { useMemo } from "react";
import type { Material } from "@/configs/types/material.type";
import { useMaterialUrls } from "@/hooks/use-material-urls";

export function MaterialThumbnail({
  material,
  className = "size-20",
  imageClassName = "h-full w-full object-cover",
  onClick,
}: {
  material: Material;
  className?: string;
  imageClassName?: string;
  onClick?: () => void;
}) {
  const materials = useMemo(() => [material], [material]);
  const urls = useMaterialUrls(materials);
  const url = urls[material.id];
  const content = url ? (
    // biome-ignore lint/performance/noImgElement: blob-URL из IndexedDB не проходит через оптимизатор Next.
    <img
      src={url}
      alt={material.name}
      loading="lazy"
      decoding="async"
      className={imageClassName}
    />
  ) : (
    <span className="grid h-full w-full place-items-center bg-muted text-muted-foreground">
      {url === undefined ? (
        <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
      ) : (
        <ImageOff aria-hidden="true" className="size-4" />
      )}
      <span className="sr-only">
        {url === undefined ? "Загрузка изображения" : "Изображение недоступно"}
      </span>
    </span>
  );
  if (onClick)
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={`Открыть материал «${material.name}»`}
        className={`overflow-hidden rounded-md bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}
      >
        {content}
      </button>
    );
  return (
    <span className={`block overflow-hidden rounded-md bg-muted ${className}`}>
      {content}
    </span>
  );
}
