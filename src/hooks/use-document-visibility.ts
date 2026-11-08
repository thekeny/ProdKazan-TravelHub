"use client";

import { useState } from "react";
import type { Material } from "@/configs/types/material.type";

export function useDocumentVisibility(materials: readonly Material[]) {
  const [visibleIds, setVisibleIds] = useState<ReadonlySet<string>>(new Set());
  const documents = materials.filter(
    (material) => material.kind === "document",
  );
  const allVisible =
    documents.length > 0 &&
    documents.every((material) => visibleIds.has(material.id));

  function setVisible(id: string, visible: boolean) {
    setVisibleIds((previous) => {
      const next = new Set(previous);
      if (visible) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleAll() {
    setVisibleIds((previous) => {
      const next = new Set(previous);
      for (const document of documents) {
        if (allVisible) next.delete(document.id);
        else next.add(document.id);
      }
      return next;
    });
  }

  return {
    visibleIds,
    allVisible,
    hasDocuments: documents.length > 0,
    setVisible,
    toggleAll,
  };
}

export type DocumentVisibility = ReturnType<typeof useDocumentVisibility>;
