"use client";

import { EyeOff, ImageOff, LoaderCircle } from "lucide-react";
import Image from "next/image";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import type { Material } from "@/configs/types/material.type";
import { useMaterialUrls } from "@/hooks/use-material-urls";

export function MaterialThumbnail({
  material,
  className = "size-20",
  imageClassName = "h-full w-full object-cover",
  onClick,
  revealed = false,
}: {
  material: Material;
  className?: string;
  imageClassName?: string;
  onClick?: (element: HTMLButtonElement) => void;
  revealed?: boolean;
}) {
  const materials = useMemo(() => [material], [material]);
  const urls = useMaterialUrls(materials);
  const url = urls[material.id];
  const hidden = material.kind === "document" && !revealed;
  const content = url ? (
    <Image
      unoptimized
      width={1600}
      height={1600}
      src={url}
      alt={material.name}
      loading="lazy"
      decoding="async"
      className={`${imageClassName} ${hidden ? "blur-xl select-none" : ""}`}
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
  const thumbnail = (
    <>
      {content}
      {hidden && url && (
        <span className="pointer-events-none absolute inset-0 grid place-items-center bg-surface/30">
          <EyeOff aria-hidden="true" className="size-4 text-foreground" />
          <span className="sr-only">Документ скрыт</span>
        </span>
      )}
    </>
  );
  if (onClick)
    return (
      <Button
        variant="plain"
        type="button"
        onClick={(event) => onClick(event.currentTarget)}
        aria-label={`Открыть материал «${material.name}»`}
        title={
          material.kind === "document"
            ? "Открыть документ"
            : "Открыть изображение"
        }
        className={`relative cursor-pointer overflow-hidden rounded-md bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}
      >
        {thumbnail}
      </Button>
    );
  return (
    <span
      className={`relative block overflow-hidden rounded-md bg-muted ${className}`}
    >
      {thumbnail}
    </span>
  );
}
