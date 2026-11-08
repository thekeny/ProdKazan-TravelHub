import { expect, test } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-08T12:00:00+03:00"));
  await page.route(/tile\.openstreetmap\.org/, (route) => route.abort());
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
                name: "Казань",
                description: "",
                startDate: "2026-11-08",
                endDate: "2026-11-10",
                cover: null,
                eventTypes: ["Музей"],
                points: [],
                legs: [],
                events: [],
              },
            ],
          },
        },
      }),
    );
  });
});

for (const width of [390, 1440]) {
  test(`${width}: file picker preserves the event form position`, async ({
    page,
    backend,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/dashboard");
    await page.getByRole("button", { name: "Добавить событие" }).click();
    const dialog = page.getByRole("dialog", { name: "Новое событие" });
    const upload = dialog.getByText("Добавить изображение", { exact: true });
    await upload.scrollIntoViewIfNeeded();
    const scroll = dialog.locator(".overflow-y-auto");
    await scroll.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    const before = await scroll.evaluate((element) => ({
      scroll: element.scrollTop,
      top: element.getBoundingClientRect().top,
    }));
    const chooserPromise = page.waitForEvent("filechooser");
    await upload.click();
    const chooser = await chooserPromise;
    const after = await scroll.evaluate((element) => ({
      scroll: element.scrollTop,
      top: element.getBoundingClientRect().top,
    }));
    expect(after.top).toBeCloseTo(before.top, 0);
    expect(after.scroll).toBeCloseTo(before.scroll, 0);
    await chooser.setFiles([]);
    expect(await scroll.evaluate((element) => element.scrollTop)).toBeCloseTo(
      before.scroll,
      0,
    );

    const files = Array.from({ length: 5 }, (_, i) => ({
      name: `photo-${i}.png`,
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6PAAAAABJRU5ErkJggg==",
        "base64",
      ),
    }));
    await dialog.locator('input[type="file"]').setInputFiles(files);
    await expect(
      dialog.getByRole("button", { name: /Открыть материал/ }),
    ).toHaveCount(5);
    expect(
      await scroll.evaluate((element) => element.getBoundingClientRect().top),
    ).toBeCloseTo(before.top, 0);
    expect(await scroll.evaluate((element) => element.scrollTop)).toBeCloseTo(
      before.scroll,
      0,
    );
    await page.screenshot({ path: `test-results/${width}-event-photos.png` });
    await dialog.getByRole("tab", { name: "Документы" }).click();
    await expect(
      dialog.getByRole("button", { name: /Открыть материал/ }),
    ).toHaveCount(0);
    await dialog
      .getByLabel("Ссылка на билет", { exact: false })
      .fill("broken link");
    await dialog
      .locator('input[type="file"]')
      .setInputFiles([{ ...files[0], name: "ticket.png" }]);
    await expect(
      dialog.getByRole("button", { name: /Открыть материал/ }),
    ).toHaveCount(1);
    await dialog.getByRole("tab", { name: "Фото", exact: true }).click();
    await expect(
      dialog.getByRole("button", { name: /Открыть материал/ }),
    ).toHaveCount(5);
    await expect(
      dialog.getByLabel("Ссылка на билет", { exact: false }),
    ).toHaveCount(0);
    await dialog
      .getByLabel("Название события", { exact: true })
      .fill("Посещение музея");
    await dialog
      .getByRole("combobox", { name: "Тип события", exact: true })
      .click();
    await page.getByRole("option", { name: "Музей", exact: true }).click();
    await dialog
      .getByRole("button", { name: "Сохранить событие", exact: true })
      .click();
    await expect(
      dialog.getByRole("tab", { name: "Документы" }),
    ).toHaveAttribute("aria-selected", "true");
    await expect(dialog.getByRole("alert")).toBeVisible();
    await dialog
      .getByLabel("Ссылка на билет", { exact: false })
      .fill("https://example.com/ticket");
    await page.screenshot({
      path: `test-results/${width}-event-documents.png`,
    });
    await dialog
      .getByRole("button", { name: "Сохранить событие", exact: true })
      .click();
    await expect(dialog).not.toBeVisible();
    const savedEvent = backend.data.trips[0].events?.[0];
    if (!savedEvent) throw new Error("Event was not saved to the backend");
    const materials = await page.evaluate((id) => {
      const preferences = JSON.parse(
        localStorage.getItem("travelhub.remote.123") ?? "{}",
      );
      return preferences.materials[id] ?? [];
    }, savedEvent.id);
    const saved = { ...savedEvent, materials };
    expect(
      saved.materials.filter(
        (material: { kind: string }) => material.kind === "photo",
      ),
    ).toHaveLength(5);
    expect(
      saved.materials.filter(
        (material: { kind: string }) => material.kind === "document",
      ),
    ).toHaveLength(1);
    expect(saved.bookingUrl).toBe("https://example.com/ticket");
    await page.goto(`/dashboard?day=2026-11-08&event=${saved.id}`);
    await page.getByRole("button", { name: "Изменить", exact: true }).click();
    const editor = page.getByRole("dialog", { name: "Редактировать событие" });
    await expect(
      editor.getByRole("button", { name: /Открыть материал/ }),
    ).toHaveCount(5);
    await editor.getByRole("tab", { name: "Документы" }).click();
    await expect(
      editor.getByRole("button", { name: /Открыть материал/ }),
    ).toHaveCount(1);
    await expect(
      editor.getByLabel("Ссылка на билет", { exact: false }),
    ).toHaveValue("https://example.com/ticket");
  });
}

test("new event types survive cancelling the event", async ({ page }) => {
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Добавить событие" }).click();
  const dialog = page.getByRole("dialog", { name: "Новое событие" });
  await dialog
    .getByRole("button", { name: "Добавить тип", exact: true })
    .click();
  await dialog.getByLabel("Название нового типа").fill("Утренний кофе");
  await dialog.getByLabel("Название нового типа").press("Enter");
  await expect(
    dialog.getByRole("combobox", { name: "Тип события" }),
  ).toContainText("Утренний кофе");
  await dialog.getByRole("button", { name: "Отмена", exact: true }).click();
  await page
    .getByRole("button", { name: "Закрыть без сохранения", exact: true })
    .click();
  await page.reload();
  await page.getByRole("button", { name: "Добавить событие" }).click();
  await dialog.getByRole("combobox", { name: "Тип события" }).click();
  await expect(
    page.getByRole("option", { name: "Утренний кофе" }),
  ).toBeVisible();
});

test("mobile account menu opens settings and signs out without overflowing", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Меню аккаунта" }).click();
  await page.getByRole("menuitem", { name: "Настройки аккаунта" }).click();
  await expect(
    page.getByRole("dialog", { name: "Настройки пользователя" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Закрыть окно" }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await expect(
    page
      .getByRole("navigation", { name: "Навигация по путешествию" })
      .getByRole("link"),
  ).toHaveCount(3);
  await page.getByRole("button", { name: "Меню аккаунта" }).click();
  await page.getByRole("menuitem", { name: "Выйти", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
});

test("trip settings confirm deletion and cancel without losing the draft", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard");
  await page.getByRole("button", { name: /Действия с путешествием/ }).click();
  await page.getByRole("menuitem", { name: "Редактировать поездку" }).click();
  const settings = page.getByRole("dialog", { name: "Настройки путешествия" });
  await settings
    .getByLabel("Название", { exact: true })
    .fill("Изменённое название");
  await settings
    .getByRole("button", { name: "Удалить путешествие", exact: true })
    .click();
  const confirmation = page.getByRole("dialog", {
    name: "Удалить путешествие?",
  });
  await expect(confirmation).toContainText("Казань");
  await confirmation
    .getByRole("button", { name: "Отмена", exact: true })
    .click();
  await expect(settings.getByLabel("Название", { exact: true })).toHaveValue(
    "Изменённое название",
  );
  await settings
    .getByRole("button", { name: "Удалить путешествие", exact: true })
    .click();
  await confirmation
    .getByRole("button", { name: "Удалить", exact: true })
    .click();
  await expect(page).toHaveURL(/\/trips$/);
  await page.reload();
  await expect(
    page.getByRole("button", { name: /Действия с путешествием/ }),
  ).toHaveCount(0);
});
