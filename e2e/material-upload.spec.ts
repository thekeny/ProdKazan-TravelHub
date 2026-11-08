import { expect, test } from "./fixtures";

test.beforeEach(async ({ page }) => {
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
                name: "Поездка",
                description: "",
                startDate: "2026-12-10",
                endDate: "2026-12-12",
                cover: null,
                events: [],
                points: [],
                legs: [],
              },
            ],
          },
        },
      }),
    );
  });
});

for (const width of [375, 1440]) {
  test(`${width}: uploads trip files without events and aligns document actions`, async ({
    page,
    backend,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/dashboard/gallery");
    await expect(
      page.getByRole("button", { name: "Загрузить фотографии" }),
    ).toBeVisible();
    await page.locator('input[type="file"]').setInputFiles({
      name: "photo.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6PAAAAABJRU5ErkJggg==",
        "base64",
      ),
    });
    await expect(
      page.getByRole("button", { name: "Открыть материал «photo.png»" }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole("button", { name: "Открыть материал «photo.png»" }),
    ).toBeVisible();
    await page.goto("/dashboard/documents");
    const upload = page.getByRole("button", {
      name: "Загрузить билеты/документы в формате PDF",
    });
    const imports = page.getByRole("button", {
      name: "Импортировать билет",
      exact: true,
    });
    await expect(upload).toBeVisible();
    const first = await upload.boundingBox();
    const second = await imports.boundingBox();
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(first?.width).toBe(second?.width);
    expect(first?.height).toBe(second?.height);
    expect(first?.y).toBe(second?.y);
    await expect(page.locator('input[type="file"]')).toHaveAttribute(
      "accept",
      ".pdf,application/pdf",
    );
    await page.locator('input[type="file"]').setInputFiles([
      {
        name: "ticket.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("%PDF-1.7\n%%EOF"),
      },
      {
        name: "bad.txt",
        mimeType: "text/plain",
        buffer: Buffer.from("invalid"),
      },
    ]);
    await expect(
      page.getByRole("button", { name: "Открыть материал «ticket.pdf»" }),
    ).toBeVisible();
    await expect(page.getByText(/bad.txt:/)).toBeVisible();
    await page.reload();
    await page
      .getByRole("button", { name: "Открыть материал «ticket.pdf»" })
      .click();
    await expect(page.getByRole("dialog").locator("iframe")).toHaveAttribute(
      "title",
      "ticket.pdf",
    );
    await expect(
      page.getByRole("link", { name: "Скачать PDF" }),
    ).toHaveAttribute("download", "ticket.pdf");
    await page.getByRole("button", { name: "Закрыть", exact: true }).click();
    await page
      .getByRole("button", { name: "Удалить материал «ticket.pdf»" })
      .click();
    await page.getByRole("button", { name: "Удалить", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Открыть материал «ticket.pdf»" }),
    ).toHaveCount(0);
    expect(backend.data.trips[0].events).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/${width}-material-upload.png`,
    });
  });
}
