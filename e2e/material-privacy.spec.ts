import { expect, test } from "./fixtures";

test("cover upload keeps its warm palette on hover", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "travelhub-e2e-fixture",
      JSON.stringify({
        username: "traveler",
        accounts: { traveler: { activeId: null, trips: [] } },
      }),
    );
  });
  await page.goto("/trips/new");
  const upload = page
    .locator("label")
    .filter({ hasText: "Выбрать изображение" });
  await expect(upload).toBeVisible();
  await upload.hover();
  await expect
    .poll(async () =>
      upload.evaluate((element) => {
        const channels = getComputedStyle(element)
          .backgroundColor.match(/[\d.]+/g)
          ?.map(Number);
        return channels ? channels[2] - channels[0] : Infinity;
      }),
    )
    .toBeLessThanOrEqual(0);
});

for (const [name, viewport] of Object.entries({
  desktop: { width: 1440, height: 1000 },
  mobile: { width: 390, height: 844 },
})) {
  test(`${name}: document visibility across events and individual preview`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.addInitScript(() => {
      if (localStorage.getItem("travelhub-e2e-fixture")) return;
      localStorage.setItem(
        "travelhub-e2e-fixture",
        JSON.stringify({
          username: "traveler",
          accounts: {
            traveler: {
              activeId: "111",
              trips: [
                {
                  id: "111",
                  name: "Билеты в путешествие",
                  description: "",
                  startDate: "2026-11-08",
                  endDate: "2026-11-09",
                  cover: null,
                  points: [],
                  legs: [],
                  events: ["ticket", "booking"].map((id, index) => ({
                    id,
                    title: index ? "Бронирование отеля" : "Билет на поезд",
                    type: "other",
                    start: `2026-11-0${8 + index}T10:00`,
                    end: "",
                    description: "",
                    bookingUrl: "",
                    materials: [
                      {
                        id,
                        name: `${id}.png`,
                        kind: "document",
                        mimeType: "image/png",
                        size: 100,
                        createdAt: "2026-11-08T09:00:00Z",
                      },
                    ],
                  })),
                },
              ],
            },
          },
        }),
      );
    });
    await page.goto("/dashboard/documents");
    await page.evaluate(async () => {
      const blob = await fetch("/brand-logo.png").then((response) =>
        response.blob(),
      );
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.open("travelhub-materials", 1);
        request.onupgradeneeded = () =>
          request.result.createObjectStore("files");
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const database = request.result;
          const transaction = database.transaction("files", "readwrite");
          for (const id of ["ticket", "booking"])
            transaction.objectStore("files").put(blob, id);
          transaction.oncomplete = () => {
            database.close();
            resolve();
          };
          transaction.onerror = () => reject(transaction.error);
        };
      });
    });
    await page.reload();
    const ticket = page.getByRole("img", { name: "ticket.png", exact: true });
    const booking = page.getByRole("img", { name: "booking.png", exact: true });
    await expect(ticket).toHaveCSS("filter", "blur(24px)");
    await expect(booking).toHaveCSS("filter", "blur(24px)");
    await page
      .getByRole("button", { name: "Показать все", exact: true })
      .click();
    await expect(ticket).toHaveCSS("filter", "none");
    await expect(booking).toHaveCSS("filter", "none");
    await page.getByRole("button", { name: "Скрыть все", exact: true }).click();
    await expect(ticket).toHaveCSS("filter", "blur(24px)");
    await expect(booking).toHaveCSS("filter", "blur(24px)");
    await page
      .getByRole("button", {
        name: "Открыть материал «ticket.png»",
        exact: true,
      })
      .click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.locator("img")).toHaveCount(1);
    await expect(dialog.locator("img")).toHaveAttribute("alt", "ticket.png");
    await expect(dialog.locator("img")).toHaveCSS("filter", "none");
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(ticket).toHaveCSS("filter", "blur(24px)");
    await expect(booking).toHaveCSS("filter", "blur(24px)");
    await page
      .getByRole("button", {
        name: "Показать документ «ticket.png»",
        exact: true,
      })
      .click();
    await expect(ticket).toHaveCSS("filter", "none");
    await page
      .getByRole("button", {
        name: "Скрыть документ «ticket.png»",
        exact: true,
      })
      .click();
    await expect(ticket).toHaveCSS("filter", "blur(24px)");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/${name}-document-privacy.png`,
    });
    await page.reload();
    await expect(ticket).toHaveCSS("filter", "blur(24px)");
  });
}
