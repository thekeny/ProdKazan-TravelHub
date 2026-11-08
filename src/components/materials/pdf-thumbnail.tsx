"use client";

import { FileText } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

export function PdfThumbnailSkeleton() {
  return (
    <span
      aria-busy="true"
      className="block h-full w-full animate-pulse bg-muted-foreground/15 motion-reduce:animate-none"
    >
      <span className="sr-only">Загрузка PDF…</span>
    </span>
  );
}

export function PdfThumbnail({
  url,
  name,
  className,
}: {
  url: string;
  name: string;
  className: string;
}) {
  const [preview, setPreview] = useState<{
    url: string;
    image: string | null;
  } | null>(null);
  useEffect(() => {
    let cancelled = false;
    import("@/lib/pdf-preview")
      .then(({ renderPdfPreview }) => renderPdfPreview(url))
      .then((image) => {
        if (!cancelled) setPreview({ url, image });
      })
      .catch(() => {
        if (!cancelled) setPreview({ url, image: null });
      });
    return () => {
      cancelled = true;
    };
  }, [url]);
  const current = preview?.url === url ? preview : null;
  if (current?.image)
    return (
      <Image
        unoptimized
        src={current.image}
        alt={`Первая страница: ${name}`}
        width={600}
        height={900}
        className={className}
      />
    );
  if (!current) return <PdfThumbnailSkeleton />;
  return (
    <span className="grid h-full w-full place-content-center justify-items-center gap-2 bg-muted text-muted-foreground">
      <FileText aria-hidden="true" className="size-8" />
      <span className="text-xs">Превью недоступно</span>
    </span>
  );
}
