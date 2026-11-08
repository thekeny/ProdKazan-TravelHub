import { expect, test } from "@playwright/test";

for (const [name, viewport] of Object.entries({
  desktop: { width: 1440, height: 1000 },
  mobile: { width: 390, height: 844 },
})) {
  test(`${name}: dashboard deep links and day selection`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.clock.setFixedTime(new Date("2026-11-07T12:00:00+03:00"));
    await page.route(/tile\.openstreetmap\.org/, (route) => route.abort());
    await page.addInitScript(() => {
      localStorage.setItem(
        "travelhub",
        JSON.stringify({
          username: "traveler",
          accounts: {
            traveler: {
              activeId: "trip",
              trips: [
                {
                  id: "trip",
                  name: "Поездка для проверки",
                  description: "Длинное описание\nВторая строка",
                  startDate: "2026-11-07",
                  endDate: "2026-11-08",
                  cover: null,
                  points: [
                    {
                      id: "point",
                      name: "Место встречи",
                      description: "",
                      lat: 55.75,
                      lng: 37.61,
                    },
                  ],
                  legs: [],
                  events: [
                    {
                      id: "event",
                      title: "Встреча в городе",
                      type: "meeting",
                      start: "2026-11-08T10:00",
                      end: "2026-11-08T11:00",
                      pointId: "point",
                      description: "Заметка",
                      materials: [],
                      bookingUrl: "https://example.com/ticket",
                    },
                  ],
                },
              ],
            },
          },
        }),
      );
    });
    await page.goto("/dashboard?day=2026-11-08&event=event");
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("dialog")).toContainText("Встреча в городе");
    await page
      .getByRole("dialog")
      .getByRole("button", { name: /Закрыть/ })
      .first()
      .click();
    await expect(page).not.toHaveURL(/event=/);
    await page.getByRole("button", { name: /День 1/ }).click();
    await expect(page).toHaveURL(/day=2026-11-07/);
    await expect(page.getByRole("button", { name: /День 1/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await page.locator(".leaflet-container").waitFor();
    await expect(page).toHaveScreenshot(`${name}-dashboard.png`, {
      animations: "disabled",
      maxDiffPixelRatio: 0.01,
    });
    await page
      .getByRole("button", { name: /Открыть редактор маршрута/ })
      .click();
    await expect(page.getByRole("dialog")).toContainText("Место встречи");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });
  test(`${name}: navigation, forms and appearance`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.addInitScript(() => {
      if (localStorage.getItem("travelhub")) return;
      localStorage.setItem(
        "travelhub",
        JSON.stringify({
          username: null,
          accounts: { traveler: { activeId: null, trips: [] } },
        }),
      );
    });
    await page.clock.setFixedTime(new Date("2026-11-07T12:00:00+03:00"));
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.route(/tile\.openstreetmap\.org/, (route) => route.abort());
    await page.goto("/login");
    await page.getByRole("heading", { name: "Вход", exact: true }).waitFor();
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot(`${name}-login.png`, {
      animations: "disabled",
      maxDiffPixelRatio: 0.01,
    });
    await page.getByLabel("Имя пользователя", { exact: true }).fill("traveler");
    await page.getByRole("button", { name: "Войти", exact: true }).click();
    await expect(page).toHaveURL(/\/trips$/);
    await page.evaluate(() => document.fonts.ready);
    await expect.soft(page).toHaveScreenshot(`${name}-trips.png`, {
      animations: "disabled",
      maxDiffPixelRatio: 0.01,
    });
    await page.getByRole("link", { name: "Создать путешествие" }).click();
    await expect(page).toHaveURL(/\/trips\/new$/);
    await page.locator("input").first().waitFor();
    await expect.soft(page).toHaveScreenshot(`${name}-trip-form.png`, {
      animations: "disabled",
      maxDiffPixelRatio: 0.01,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    expect(errors).toEqual([]);
  });
}
