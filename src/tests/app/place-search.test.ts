// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
import { GET } from "@/app/gateway/places/search/route";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

it("searches Cyrillic names using a language supported by public Photon", async () => {
  vi.stubEnv("GEOCODING_API_URL", "");
  const fetchMock = vi.fn(async (input: URL) => {
    if (input.searchParams.get("lang") !== "default") {
      return Response.json(
        { lang: "Language is not supported" },
        { status: 400 },
      );
    }
    return Response.json({
      features: [
        {
          geometry: { type: "Point", coordinates: [30.325, 59.935] },
          properties: { name: "Дом Зингера", city: "Санкт-Петербург" },
        },
      ],
    });
  });
  vi.stubGlobal("fetch", fetchMock);
  const response = await GET(
    new Request(
      `http://localhost/gateway/places/search?q=${encodeURIComponent("зингер")}`,
    ),
  );
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual([
    expect.objectContaining({ name: "Дом Зингера", lat: 59.935, lng: 30.325 }),
  ]);
  expect(fetchMock.mock.calls[0][0].searchParams.get("q")).toBe("зингер");
});
