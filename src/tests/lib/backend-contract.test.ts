import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { isAllowedBackendPath } from "@/lib/backend-proxy";

const source = readFileSync(
  join(process.cwd(), "src/api/generated/sdk.gen.ts"),
  "utf8",
);

function sdkEntries() {
  const entries: { name: string; url: string }[] = [];
  let current: string | undefined;
  for (const line of source.split("\n")) {
    const method = /export const (\w+) =/.exec(line);
    if (method) current = method[1];
    const url = /url:\s*'([^']+)'/.exec(line);
    if (url && current) {
      entries.push({ name: current, url: url[1] });
      current = undefined;
    }
  }
  return entries;
}

function samplePath(path: string) {
  return path
    .replaceAll("{trip_id}", "123")
    .replaceAll("{tripId}", "123")
    .replaceAll("{pointId}", "456")
    .replaceAll("{transferId}", "456")
    .replaceAll("{eventId}", "456")
    .replaceAll("{cover_id}", "photo.webp")
    .replaceAll("{code}", "Invite-1")
    .replace(/^\//, "")
    .replace(/\/+$/, "");
}

describe("SDK and backend proxy contract", () => {
  const entries = sdkEntries();

  it("parses every generated SDK endpoint", () => {
    expect(entries.length).toBeGreaterThan(30);
    expect(entries.map((entry) => entry.name)).toContain("adminListAllUsers");
    expect(entries.map((entry) => entry.name)).toContain("tripsJoinTrip");
  });

  it("allows every non-admin SDK endpoint through the proxy", () => {
    const rejected = entries
      .filter((entry) => !entry.name.startsWith("admin"))
      .filter((entry) => !isAllowedBackendPath(samplePath(entry.url)))
      .map((entry) => `${entry.name} (${entry.url})`);
    expect(rejected).toEqual([]);
  });

  it("keeps admin endpoints outside the public proxy surface", () => {
    const admin = entries.filter((entry) => entry.name.startsWith("admin"));
    expect(admin.length).toBeGreaterThan(0);
    for (const entry of admin)
      expect(isAllowedBackendPath(samplePath(entry.url)), entry.name).toBe(
        false,
      );
  });
});
