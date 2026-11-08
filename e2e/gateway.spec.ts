import { expect, test } from "@playwright/test";

test("restores the server account when infrastructure owns /api", async ({
  page,
}) => {
  const interceptedApi: string[] = [];
  await page.route("**/api/**", (route) => {
    interceptedApi.push(new URL(route.request().url()).pathname);
    return route.fulfill({ status: 404, json: { detail: "Not Found" } });
  });
  await page.route("**/gateway/backend/**", (route) => {
    const path = new URL(route.request().url()).pathname;
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
  expect(interceptedApi).toEqual([]);
});
