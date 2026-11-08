import { PLACE_SEARCH } from "@/configs/consts/place-search.const";
import type { PlaceSuggestion } from "@/configs/types/place-search.type";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (
    query.length < PLACE_SEARCH.minLength ||
    query.length > PLACE_SEARCH.maxLength
  )
    return Response.json([], { status: 400 });
  try {
    const url = new URL(process.env.GEOCODING_API_URL || PLACE_SEARCH.provider);
    url.searchParams.set("q", query);
    url.searchParams.set("limit", String(PLACE_SEARCH.limit));
    // The public Photon instance rejects ru; default preserves local place names.
    url.searchParams.set("lang", "default");
    const response = await fetch(url, {
      signal: AbortSignal.any([
        request.signal,
        AbortSignal.timeout(PLACE_SEARCH.timeout),
      ]),
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Search unavailable");
    const data: unknown = await response.json();
    if (
      !data ||
      typeof data !== "object" ||
      !("features" in data) ||
      !Array.isArray(data.features)
    )
      throw new Error("Invalid response");
    const results: PlaceSuggestion[] = [];
    for (const feature of data.features as unknown[]) {
      if (!isRecord(feature)) continue;
      const { geometry, properties } = feature;
      if (
        !isRecord(geometry) ||
        geometry.type !== "Point" ||
        !Array.isArray(geometry.coordinates) ||
        !isRecord(properties)
      )
        continue;
      const [lng, lat] = geometry.coordinates;
      if (
        typeof lat !== "number" ||
        typeof lng !== "number" ||
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        Math.abs(lat) > 90 ||
        Math.abs(lng) > 180
      )
        continue;
      const name =
        typeof properties.name === "string"
          ? properties.name
          : properties.street;
      if (typeof name !== "string" || !name.trim()) continue;
      const address = [
        ...new Set(
          [
            properties.street,
            properties.housenumber,
            properties.city,
            properties.state,
            properties.country,
          ].filter(
            (part): part is string => typeof part === "string" && Boolean(part),
          ),
        ),
      ].join(", ");
      results.push({
        id: `${lat},${lng},${name}`,
        name: name.slice(0, PLACE_SEARCH.maxLength),
        address,
        lat,
        lng,
      });
    }
    return Response.json(results.slice(0, PLACE_SEARCH.limit), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json(
      { message: "Поиск мест временно недоступен." },
      { status: 502 },
    );
  }
}
