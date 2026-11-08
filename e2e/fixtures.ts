import { test as base, expect } from "@playwright/test";
import type { EventValues } from "../src/configs/types/event.type";
import type { TravelData } from "../src/configs/types/travel.type";

type Backend = { username: string | null; data: TravelData };
type Seed = { username: string | null; accounts: Record<string, TravelData> };

export const test = base.extend<{ backend: Backend }>({
  // biome-ignore lint/correctness/noEmptyPattern: Playwright requires fixture destructuring.
  backend: async ({}, use) => {
    await use({ username: null, data: { trips: [], activeId: null } });
  },
  page: async ({ page, backend }, use) => {
    let initialized = false;
    let nextId = 1000;
    await page.addInitScript(() => {
      Object.defineProperty(window, "Notification", {
        configurable: true,
        value: { permission: "denied" },
      });
    });
    await page.route("**/gateway/backend/**", async (route) => {
      if (!initialized) {
        const seed: Seed | null = await page.evaluate(() =>
          JSON.parse(localStorage.getItem("travelhub-e2e-fixture") ?? "null"),
        );
        backend.username = seed?.username ?? null;
        backend.data = seed?.accounts.traveler ?? { trips: [], activeId: null };
        for (const trip of backend.data.trips) {
          for (const event of trip.events ?? []) {
            if (event.id === "ticket") event.id = "444";
            if (event.id === "booking") event.id = "555";
          }
        }
        await page.evaluate((data) => {
          localStorage.setItem(
            "travelhub.remote.123",
            JSON.stringify({
              activeId: data.activeId,
              materials: Object.fromEntries(
                data.trips.flatMap((t) =>
                  (t.events ?? []).map((e) => [e.id, e.materials]),
                ),
              ),
              eventTypes: Object.fromEntries(
                data.trips.flatMap((t) =>
                  (t.events ?? [])
                    .filter((e) => e.customType !== undefined)
                    .map((e) => [e.id, e.customType]),
                ),
              ),
              tripEventTypes: Object.fromEntries(
                data.trips.map((t) => [t.id, t.eventTypes ?? []]),
              ),
            }),
          );
        }, backend.data);
        initialized = true;
      }
      const request = route.request();
      const path = new URL(request.url()).pathname
        .replace("/gateway/backend", "")
        .replace(/\/$/, "");
      const method = request.method();
      const user = { id: "123", username: backend.username ?? "traveler" };
      if (path === "/auth/login") {
        backend.username =
          new URLSearchParams(request.postData() ?? "").get("username") ??
          "traveler";
        return route.fulfill({ json: {} });
      }
      if (path === "/auth/register") return route.fulfill({ json: {} });
      if (
        path === "/auth/logout" ||
        (path === "/auth/me" && method === "DELETE")
      ) {
        backend.username = null;
        return route.fulfill({ json: {} });
      }
      if (path === "/auth/me")
        return route.fulfill(
          backend.username ? { json: user } : { status: 401, json: {} },
        );
      if (path === "/integrations/google-drive")
        return route.fulfill({ json: { enabled: false, status: "disabled" } });
      if (path === "/trips")
        return route.fulfill({
          json: backend.data.trips.map((trip) => ({
            id: trip.id,
            name: trip.name,
            description: trip.description,
            startedOn: trip.startDate,
            endedOn: trip.endDate,
            cover: null,
          })),
        });
      const [, tripId, collection] = path.split("/").slice(1);
      const trip = backend.data.trips.find((trip) => trip.id === tripId);
      if (trip && !collection && method === "DELETE") {
        backend.data.trips = backend.data.trips.filter((item) => item !== trip);
        return route.fulfill({ json: {} });
      }
      if (trip && collection === "collaboratrs")
        return route.fulfill({ json: { owner: user, collaborators: [] } });
      if (trip && collection === "points")
        return route.fulfill({
          json: (trip.points ?? []).map((point) => ({
            id: point.id,
            name: point.name,
            description: point.description,
            latitude: point.lat,
            longitude: point.lng,
          })),
        });
      if (trip && collection === "transfers")
        return route.fulfill({ json: [] });
      if (trip && collection === "events") {
        if (method === "POST") {
          const body: {
            title: string;
            type: EventValues["type"];
            startedAt: string;
            endedAt: string | null;
            description: string | null;
            waypointId: string | null;
            bookingUrl: string | null;
          } = request.postDataJSON();
          const event = {
            id: String(nextId++),
            title: body.title,
            type: body.type,
            start: body.startedAt.slice(0, 16),
            end: body.endedAt?.slice(0, 16) ?? "",
            description: body.description ?? "",
            pointId: body.waypointId,
            bookingUrl: body.bookingUrl ?? "",
            materials: [],
          };
          trip.events = [...(trip.events ?? []), event];
          return route.fulfill({
            status: 201,
            json: { ...body, id: event.id },
          });
        }
        return route.fulfill({
          json: (trip.events ?? []).map((event) => ({
            id: event.id,
            title: event.title,
            type: event.type,
            description: event.description,
            startedAt: `${event.start}:00Z`,
            endedAt: event.end ? `${event.end}:00Z` : null,
            waypointId: event.pointId,
            bookingUrl: event.bookingUrl,
          })),
        });
      }
      return route.fulfill({ status: 404, json: {} });
    });
    await use(page);
  },
});

export { expect };
