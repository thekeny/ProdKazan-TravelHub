import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";

// Run against a running Next server. Only records created by this test are removed.
const origin = process.env.TEST_APP_URL ?? "http://localhost:3001";
const username = `test_${Date.now()}`;
const password = `Th_${randomBytes(12).toString("hex")}`;
const cookies = new Map();
let registered = false;
let tripId;
async function request(
  path,
  method = "GET",
  body,
  expected = 200,
  anonymous = false,
) {
  const response = await fetch(`${origin}/gateway/backend${path}`, {
    method,
    headers: {
      Origin: origin,
      ...(!anonymous
        ? {
            Cookie: [...cookies]
              .map(([key, value]) => `${key}=${value}`)
              .join("; "),
          }
        : {}),
      ...(body
        ? {
            "Content-Type":
              body instanceof URLSearchParams
                ? "application/x-www-form-urlencoded"
                : "application/json",
          }
        : {}),
    },
    body: body
      ? body instanceof URLSearchParams
        ? body.toString()
        : JSON.stringify(body)
      : undefined,
    signal: AbortSignal.timeout(60_000),
  });
  if (!anonymous)
    for (const header of response.headers.getSetCookie()) {
      const [pair] = header.split(";");
      const index = pair.indexOf("=");
      const key = pair.slice(0, index);
      const value = pair.slice(index + 1);
      if (value) cookies.set(key, value);
      else cookies.delete(key);
      assert.match(header, /HttpOnly/i);
    }
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  assert.equal(
    response.status,
    expected,
    `${method} ${path}: ${response.status} ${JSON.stringify(data)}`,
  );
  console.log(`${method} ${path.replace(/\d+/g, ":id")} ${response.status}`);
  return data;
}
const credentials = (secret = password) =>
  new URLSearchParams({ grant_type: "password", username, password: secret });
try {
  await request("/health");
  await request("/trips", "GET", undefined, 401, true);
  await request("/auth/register", "POST", { username, password }, 201);
  registered = true;
  await request("/auth/login", "POST", credentials("incorrect"), 401);
  const login = await request("/auth/login", "POST", credentials());
  assert.equal(
    login.access_token,
    undefined,
    "Access token must stay in HttpOnly cookie",
  );
  assert.ok(cookies.has("travelhub_access"));
  assert.ok(cookies.has("travelhub_refresh"));
  assert.equal((await request("/auth/me")).username, username);
  const values = {
    name: "Integration test",
    description: "Test trip",
    startedOn: "2026-11-07",
    endedOn: "2026-11-10",
    cover: "https://example.com/cover.jpg",
  };
  const trip = await request("/trips", "POST", values, 201);
  tripId = trip.id;
  assert.equal(trip.cover, values.cover);
  assert.match(tripId, /^[1-9]\d*$/);
  const base = `/trips/${tripId}`;
  assert.ok((await request("/trips")).some((item) => item.id === tripId));
  assert.equal(
    (await request(base, "PATCH", { name: "Updated integration test" })).name,
    "Updated integration test",
  );
  const invite = await request(
    `${base}/code/generate?max_uses=1`,
    "POST",
    undefined,
    201,
  );
  assert.equal(typeof invite.code, "string");
  assert.ok(invite.code.length > 0);
  assert.equal(typeof invite.uses, "number");
  const collaborators = await request(`${base}/collaboratrs`);
  assert.equal(collaborators.owner.username, username);
  assert.ok(Array.isArray(collaborators.collaborators));
  const point = await request(
    `${base}/points`,
    "POST",
    { name: "Start", latitude: 55.79, longitude: 49.12 },
    201,
  );
  const end = await request(
    `${base}/points`,
    "POST",
    { name: "End", latitude: 55.8, longitude: 49.13 },
    201,
  );
  assert.equal(
    (
      await request(`${base}/points/${point.id}`, "PATCH", {
        name: "Updated start",
      })
    ).name,
    "Updated start",
  );
  const event = await request(
    `${base}/events`,
    "POST",
    {
      title: "Museum",
      type: "tour",
      startedAt: "2026-11-07T10:00:00Z",
      endedAt: null,
      waypointId: point.id,
      bookingUrl: "https://example.com/ticket",
    },
    201,
  );
  assert.equal(
    (
      await request(`${base}/events/${event.id}`, "PATCH", {
        title: "Updated museum",
      })
    ).title,
    "Updated museum",
  );
  const leg = await request(
    `${base}/transfers`,
    "POST",
    {
      transportType: "walk",
      startedAt: "2026-11-07T11:00:00Z",
      endedAt: "2026-11-07T11:30:00Z",
      startsAtWaypointId: point.id,
      endsAtWaypointId: end.id,
      description: "Test transfer",
    },
    201,
  );
  assert.equal(
    (
      await request(`${base}/transfers/${leg.id}`, "PATCH", {
        transportType: "car",
      })
    ).transportType,
    "car",
  );
  for (const kind of ["points", "events", "transfers"])
    assert.ok((await request(`${base}/${kind}`)).length);
  cookies.delete("travelhub_access");
  assert.equal((await request("/auth/me")).username, username);
  assert.ok(cookies.has("travelhub_access"), "Expired access must be renewed");
  await request(`${base}/transfers/${leg.id}`, "DELETE", undefined, 204);
  await request(`${base}/events/${event.id}`, "PATCH", { waypointId: null });
  await request(`${base}/points/${point.id}`, "DELETE", undefined, 204);
  await request(`${base}/events/${event.id}`, "DELETE", undefined, 204);
  await request(`${base}/points/${end.id}`, "DELETE", undefined, 204);
  await request(base, "DELETE", undefined, 204);
  tripId = undefined;
  await request("/auth/logout", "POST", undefined, 204);
  assert.equal(cookies.size, 0);
  await request("/auth/me", "GET", undefined, 401);
  console.log("Backend integration passed.");
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  if (registered) {
    await request("/auth/login", "POST", credentials());
    if (tripId) {
      const base = `/trips/${tripId}`;
      for (const kind of ["transfers", "events", "points"]) {
        for (const item of await request(`${base}/${kind}`))
          await request(`${base}/${kind}/${item.id}`, "DELETE", undefined, 204);
      }
      await request(base, "DELETE", undefined, 204);
    }
    await request("/auth/me", "DELETE", undefined, 204);
    console.log("Temporary account and trip removed.");
  }
}
