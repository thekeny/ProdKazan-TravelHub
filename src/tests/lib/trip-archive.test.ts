import { expect, it, vi } from "vitest";
import { readTripArchive } from "@/lib/trip-archive";

function file(content: string) {
  return Object.assign(
    new File([content], "trip.json", { type: "application/json" }),
    { text: vi.fn(async () => content) },
  );
}
it("preserves archive IDs and historical dates without reconstructing its records", async () => {
  const archive = {
    version: 1,
    trip: { name: "История", startedOn: "2000-01-01" },
    points: [
      { id: "9223372036854775806", name: "Место", latitude: 55, longitude: 49 },
    ],
    events: [],
    transfers: [],
  };
  expect(await readTripArchive(file(JSON.stringify(archive)))).toEqual(archive);
});
it("rejects invalid JSON and unsupported archives before calling the API", async () => {
  await expect(readTripArchive(file("broken"))).rejects.toThrow("JSON");
  await expect(readTripArchive(file('{"version":2}'))).rejects.toThrow(
    "версии 1",
  );
});
it("rejects oversized archives before reading them", async () => {
  const archive = file(" ".repeat(1024 * 1024 + 1));
  await expect(readTripArchive(archive)).rejects.toThrow("1 МиБ");
  expect(archive.text).not.toHaveBeenCalled();
});
