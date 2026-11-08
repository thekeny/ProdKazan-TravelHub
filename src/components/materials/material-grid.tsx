"use client";

import { Eye, EyeOff, ImageOff, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { MaterialThumbnail } from "@/components/materials/material-thumbnail";
import { Button } from "@/components/ui/button";
import { ConfirmDelete } from "@/components/ui/confirm-delete";
import type { Material } from "@/configs/types/material.type";
import {
  type DocumentVisibility,
  useDocumentVisibility,
} from "@/hooks/use-document-visibility";
import { useMaterialUrls } from "@/hooks/use-material-urls";
import { DocumentVisibilityToggle } from "./document-visibility-toggle";
import { MaterialPreview } from "./material-preview";

export function MaterialGrid({
  materials,
  onRemove,
  emptyLabel = "Материалов пока нет",
  documentVisibility,
}: {
  materials: readonly Material[];
  onRemove?: (material: Material) => void;
  emptyLabel?: string;
  documentVisibility?: DocumentVisibility;
}) {
  const localVisibility = useDocumentVisibility(materials);
  const visibility = documentVisibility ?? localVisibility;
  const [removing, setRemoving] = useState<Material | null>(null);
  const list = useMemo(() => [...materials], [materials]);
  const urls = useMaterialUrls(list);
  const [openId, setOpenId] = useState<string | null>(null);
  const previewTrigger = useRef<HTMLButtonElement | null>(null);
  const open = list.find((material) => material.id === openId);
  const openUrl = open ? urls[open.id] : null;
  return (
    <>
      <ConfirmDelete
        open={!!removing}
        title="Удалить материал?"
        onClose={() => setRemoving(null)}
        onConfirm={() => {
          if (removing) onRemove?.(removing);
          setRemoving(null);
        }}
      >
        Материал «{removing?.name}» будет удалён из события после сохранения
        изменений.
      </ConfirmDelete>
      {!documentVisibility && visibility.hasDocuments && (
        <div className="mb-3 flex justify-end">
          <DocumentVisibilityToggle visibility={visibility} />
        </div>
      )}
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {list.map((material) => (
          <li key={material.id} className="relative min-w-0">
            <MaterialThumbnail
              material={material}
              className="aspect-square w-full"
              revealed={visibility.visibleIds.has(material.id)}
              onClick={(element) => {
                previewTrigger.current = element;
                setOpenId(material.id);
              }}
            />
            <div className="mt-1 flex items-center gap-1">
              <p className="min-w-0 flex-1 user-text whitespace-normal text-[11px] text-muted-foreground">
                {material.name}
              </p>
              {material.kind === "document" && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-11"
                  aria-label={`${visibility.visibleIds.has(material.id) ? "Скрыть" : "Показать"} документ «${material.name}»`}
                  aria-pressed={visibility.visibleIds.has(material.id)}
                  onClick={() =>
                    visibility.setVisible(
                      material.id,
                      !visibility.visibleIds.has(material.id),
                    )
                  }
                >
                  {visibility.visibleIds.has(material.id) ? (
                    <EyeOff aria-hidden="true" />
                  ) : (
                    <Eye aria-hidden="true" />
                  )}
                </Button>
              )}
              {onRemove && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1 size-11 bg-surface text-foreground shadow-sm hover:bg-surface-hover"
                  aria-label={`Удалить материал «${material.name}»`}
                  onClick={() => setRemoving(material)}
                >
                  <X />
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {open && openUrl && (
        <MaterialPreview
          returnFocus={previewTrigger}
          material={open}
          url={openUrl}
          onClose={() => setOpenId(null)}
        />
      )}
      {!list.length && (
        <p className="flex items-center gap-2 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
          <ImageOff aria-hidden="true" className="size-4" />
          {emptyLabel}
        </p>
      )}
    </>
  );
}
