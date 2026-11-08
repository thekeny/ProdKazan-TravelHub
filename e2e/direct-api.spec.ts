import { expect, test } from "@playwright/test";

test("restores the account directly through the backend with a bearer token", async ({
  page,
}) => {
  const proxies: string[] = [];
  const authorized: string[] = [];
  await page.route("**/gateway/backend/**", (route) => {
    proxies.push(route.request().url());
    return route.abort();
  });
  await page.route("**/api/v1/**", (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace(/\/$/, "");
    if (path.endsWith("/auth/refresh"))
      return route.fulfill({ json: { access_token: "test-access" } });
    expect(request.headers().authorization).toBe("Bearer test-access");
    authorized.push(path);
    if (path.endsWith("/cover/test.png"))
      return route.fulfill({
        contentType: "image/png",
        body: Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
          "base64",
        ),
      });
    if (path === "/api/v1/trips")
      return route.fulfill({
        json: [
          {
            id: "111",
            name: "Test trip",
            startedOn: "2026-12-10",
            endedOn: "2026-12-12",
            cover: "/api/v1/trips/111/cover/test.png",
          },
        ],
      });
    return route.fulfill({
      json: path.endsWith("/auth/me")
        ? { id: "123", username: "traveler" }
        : path.endsWith("/integrations/google-drive")
          ? { enabled: false, status: "disabled" }
          : [],
    });
  });
  await page.addInitScript(() => {
    Object.defineProperty(window, "Notification", {
      configurable: true,
      value: { permission: "denied" },
    });
  });
  await page.goto("/trips");
  await expect(
    page.getByRole("heading", { name: "Ваши путешествия" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Ваши путешествия" }),
  ).toBeVisible();
  expect(authorized).toContain("/api/v1/auth/me");
  await expect(page.locator('img[src^="blob:"]')).toBeVisible();
  expect(authorized).toContain("/api/v1/trips/111/cover/test.png");
  expect(proxies).toEqual([]);
});
