"use client";

import { useEffect, useState } from "react";
import * as sdk from "@/api/generated/sdk.gen";
import { isServerCover, serverCoverUrl } from "@/lib/remote-covers";
import { apiId, apiResult } from "@/lib/travel-api";

export function useCoverPreview(cover: string | null) {
  const source = serverCoverUrl(cover);
  const [preview, setPreview] = useState<{ source: string; url: string }>();
  useEffect(() => {
    if (!isServerCover(source)) return;
    const match = /\/trips\/(\d+)\/cover\/([^/]+)$/.exec(source);
    if (!match) return;
    let active = true;
    let url: string | undefined;
    const controller = new AbortController();
    void apiResult(
      sdk.tripsGetTripCover({
        path: { trip_id: apiId(match[1]), cover_id: match[2] },
        parseAs: "blob",
        signal: controller.signal,
      }),
    )
      .then((blob) => {
        if (!active || !(blob instanceof Blob)) return;
        url = URL.createObjectURL(blob);
        setPreview({ source, url });
      })
      .catch(() => undefined);
    return () => {
      active = false;
      controller.abort();
      if (url) URL.revokeObjectURL(url);
    };
  }, [source]);
  return isServerCover(source)
    ? preview?.source === source
      ? preview.url
      : null
    : source;
}
