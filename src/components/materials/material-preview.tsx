"use client";
import { Dialog } from "@base-ui/react/dialog";
import Image from "next/image";
import { type RefObject, useState } from "react";
import { Button } from "@/components/ui/button";
import { DialogPopup } from "@/components/ui/dialog-popup";
import type { Material } from "@/configs/types/material.type";
import { DrivePhotoExport } from "./drive-photo-export";
export function MaterialPreview({
  material,
  url,
  onClose,
  returnFocus,
}: {
  material: Material;
  url: string;
  onClose: () => void;
  returnFocus: RefObject<HTMLButtonElement | null>;
}) {
  const [dimensions, setDimensions] = useState({ width: 1600, height: 1600 });
  return (
    <Dialog.Root
      open
      modal
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop
          forceRender
          className="dialog-backdrop fixed inset-0 z-[70] bg-overlay/60 backdrop-blur-md"
        />
        <DialogPopup
          finalFocus={returnFocus}
          className="dialog-popup fixed inset-0 z-[70] m-auto h-fit max-h-[calc(100dvh-2rem)] w-fit max-w-[min(56rem,calc(100vw-2rem))] overflow-auto rounded-xl bg-surface p-2"
        >
          <Dialog.Title className="sr-only">{material.name}</Dialog.Title>
          <Image
            unoptimized
            src={url}
            alt={material.name}
            {...dimensions}
            onLoad={(event) => {
              const image = event.currentTarget;
              setDimensions({
                width: image.naturalWidth,
                height: image.naturalHeight,
              });
            }}
            className="max-h-[80dvh] w-auto max-w-full rounded-lg object-contain"
          />
          <DrivePhotoExport material={material} />
          <div className="flex items-center justify-between gap-3 p-2">
            <p className="min-w-0 user-text whitespace-normal text-sm">
              {material.name}
            </p>
            <Button
              type="button"
              variant="outline"
              className="h-10"
              onClick={onClose}
            >
              Закрыть
            </Button>
          </div>
        </DialogPopup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
