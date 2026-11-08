"use client";
import { useEffect, useState } from "react";
import { PLACE_SEARCH } from "@/configs/consts/place-search.const";
import type { PlaceSuggestion } from "@/configs/types/place-search.type";

const cache = new Map<string, PlaceSuggestion[]>();
export function usePlaceSearch(query: string, enabled: boolean) {
  const [state, setState] = useState<{
    items: PlaceSuggestion[];
    loading: boolean;
    error: boolean;
  }>({ items: [], loading: false, error: false });
  useEffect(() => {
    const q = query.trim();
    if (!enabled || q.length < PLACE_SEARCH.minLength) {
      setState({ items: [], loading: false, error: false });
      return;
    }
    const controller = new AbortController();
    setState({ items: [], loading: true, error: false });
    const timer = setTimeout(async () => {
      try {
        let items = cache.get(q);
        if (!items) {
          const response = await fetch(
            `${PLACE_SEARCH.path}?q=${encodeURIComponent(q)}`,
            {
              signal: AbortSignal.any([
                controller.signal,
                AbortSignal.timeout(PLACE_SEARCH.timeout + 1000),
              ]),
            },
          );
          if (!response.ok) throw new Error("Search unavailable");
          items = (await response.json()) as PlaceSuggestion[];
          if (cache.size >= PLACE_SEARCH.cacheSize)
            cache.delete(cache.keys().next().value ?? "");
          cache.set(q, items);
        }
        if (!controller.signal.aborted)
          setState({ items, loading: false, error: false });
      } catch {
        if (!controller.signal.aborted)
          setState({ items: [], loading: false, error: true });
      }
    }, PLACE_SEARCH.delay);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, enabled]);
  return state;
}
