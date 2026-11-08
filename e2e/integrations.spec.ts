import { expect, test } from "@playwright/test";

test("photo export converts WebP once and preserves the operation across retries", async ({
  page,
}) => {
  const requests: { key: string; bytes: Buffer }[] = [];
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname
      .replace("/api/v1", "")
      .replace(/\/$/, "");
    if (path === "/auth/refresh")
      return route.fulfill({ json: { access_token: "fixture-token" } });
    if (path === "/auth/me")
      return route.fulfill({ json: { id: "123", username: "traveler" } });
    if (path === "/trips")
      return route.fulfill({
        json: [
          {
            id: "111",
            name: "Фото",
            startedOn: "2026-12-10",
            endedOn: "2026-12-12",
          },
        ],
      });
    if (path.endsWith("/events"))
      return route.fulfill({
        json: [
          {
            id: "222",
            title: "Прогулка",
            type: "other",
            startedAt: "2026-12-10T10:00:00Z",
          },
        ],
      });
    if (path.endsWith("/points") || path.endsWith("/transfers"))
      return route.fulfill({ json: [] });
    if (path === "/integrations/google-drive")
      return route.fulfill({ json: { enabled: true, status: "connected" } });
    if (path === "/integrations/google-drive/photo-exports") {
      const body = request.postDataBuffer();
      if (!body) throw new Error("Missing upload");
      expect(body.toString()).toContain('filename="photo.jpg"');
      expect(body.toString()).toContain("Content-Type: image/jpeg");
      // Multipart boundaries may change; compare the encoded image bytes.
      const offset = body.indexOf(Buffer.from("\r\n\r\n")) + 4;
      const end = body.lastIndexOf(Buffer.from("\r\n--"));
      requests.push({
        key: request.headers()["idempotency-key"],
        bytes: body.subarray(offset, end),
      });
      if (requests.length === 1)
        return route.fulfill({
          status: 409,
          json: { detail: { exportId: "333" } },
        });
      return route.fulfill({
        status: 201,
        json: {
          id: "333",
          name: "photo.jpg",
          status: "succeeded",
          mimeType: "image/jpeg",
          size: requests[0].bytes.length,
          driveFileId: "file",
          webViewLink: "https://drive.google.com/file/test",
        },
      });
    }
    return route.fulfill({ status: 404, json: {} });
  });
  await page.goto("/trips");
  await page.evaluate(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 20;
    canvas.height = 20;
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (value) => (value ? resolve(value) : reject(new Error("No image"))),
        "image/webp",
      ),
    );
    localStorage.setItem(
      "travelhub.remote.123",
      JSON.stringify({
        activeId: "111",
        materials: {
          "222": [
            {
              id: "photo",
              name: "photo.webp",
              mimeType: "image/webp",
              kind: "photo",
              size: blob.size,
              createdAt: "2026-12-10T10:00:00Z",
            },
          ],
        },
      }),
    );
    await new Promise<void>((resolve, reject) => {
      const open = indexedDB.open("travelhub-materials", 1);
      open.onupgradeneeded = () => open.result.createObjectStore("files");
      open.onerror = () => reject(open.error);
      open.onsuccess = () => {
        const db = open.result;
        const tx = db.transaction("files", "readwrite");
        tx.objectStore("files").put(blob, "photo");
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      };
    });
  });
  await page.goto("/dashboard/gallery");
  await page
    .getByRole("button", { name: "Открыть материал «photo.webp»" })
    .click();
  await page.getByRole("button", { name: "Сохранить в Google Drive" }).click();
  await expect(
    page.getByRole("button", { name: "Проверить экспорт" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Повторить экспорт" }).click();
  await expect(
    page.getByRole("link", { name: "Открыть в Google Drive" }),
  ).toHaveAttribute("href", "https://drive.google.com/file/test");
  expect(requests).toHaveLength(2);
  expect(requests[1]).toEqual(requests[0]);
  await page.screenshot({ path: "test-results/drive-photo-export.png" });
});

for (const viewport of [
  { width: 1440, height: 1000 },
  { width: 390, height: 844 },
]) {
  test(`${viewport.width}: Drive settings, ticket confirmation and trip archives`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    const trip = {
      id: "9223372036854775801",
      name: "Казань",
      startedOn: "2026-12-10",
      endedOn: "2026-12-12",
      description: "",
    };
    const owner = { id: "123", username: "traveler" };
    let imported = false;
    let applied = false;
    let disconnected = false;
    let previewCount = 0;
    const point = {
      name: "Отель",
      address: "Казань",
      latitude: 55.79,
      longitude: 49.12,
    };
    await page.route("**/api/v1/**", async (route) => {
      const request = route.request();
      const path = new URL(request.url()).pathname
        .replace("/api/v1", "")
        .replace(/\/$/, "");
      if (path === "/auth/refresh")
        return route.fulfill({ json: { access_token: "fixture-token" } });
      if (path === "/auth/me") return route.fulfill({ json: owner });
      if (path === "/trips" && request.method() === "GET")
        return route.fulfill({
          json: imported
            ? [trip, { ...trip, id: "9223372036854775802", name: "Копия" }]
            : [trip],
        });
      if (path.endsWith("/collaboratrs"))
        return route.fulfill({ json: { owner, collaborators: [] } });
      if (path === "/integrations/google-drive") {
        if (request.method() === "DELETE") disconnected = true;
        return route.fulfill({
          json: {
            enabled: true,
            status: disconnected ? "disconnected" : "connected",
            email: disconnected ? null : "test@example.com",
            revocationPending: false,
          },
        });
      }
      if (path.endsWith("/tickets/preview")) {
        previewCount++;
        expect(request.headers()["content-type"]).toContain(
          "multipart/form-data",
        );
        expect(request.postData()).toContain(
          "https://tickets.example/stay.pdf",
        );
        if (previewCount === 1)
          return route.fulfill({
            status: 422,
            json: {
              detail: {},
              errorCode: "ValidationFailed",
              errors: ["ticket_kind_ambiguous"],
            },
          });
        expect(request.postData()).toContain('name="kind"');
        expect(request.postData()).toContain("stay");
        return route.fulfill({
          json: {
            kind: "stay",
            stay: { name: "Отель", address: "Казань", point },
            startedAt: "2026-12-10T15:00:00+03:00",
            endedAt: null,
            issues: [],
            readyToApply: true,
          },
        });
      }
      if (path.endsWith("/tickets/apply")) {
        expect(previewCount).toBe(2);
        expect(request.postDataJSON()).toEqual({
          kind: "stay",
          stay: point,
          startedAt: "2026-12-10T15:00:00+03:00",
        });
        applied = true;
        return route.fulfill({
          status: 201,
          json: {
            points: [{ ...point, id: "333" }],
            event: {
              id: "444",
              title: "Отель",
              type: "hotel",
              startedAt: "2026-12-10T15:00:00+03:00",
            },
          },
        });
      }
      if (path.endsWith("/points"))
        return route.fulfill({
          json: applied ? [{ ...point, id: "333" }] : [],
        });
      if (path.endsWith("/events"))
        return route.fulfill({
          json: applied
            ? [
                {
                  id: "444",
                  title: "Отель",
                  type: "hotel",
                  startedAt: "2026-12-10T15:00:00+03:00",
                  waypointId: "333",
                },
              ]
            : [],
        });
      if (path.endsWith("/transfers")) return route.fulfill({ json: [] });
      if (path.endsWith("/export"))
        return route.fulfill({
          json: {
            version: 1,
            trip: {
              name: trip.name,
              startedOn: trip.startedOn,
              endedOn: trip.endedOn,
            },
            points: [],
            events: [],
            transfers: [],
          },
        });
      if (path === "/trips/import") {
        expect(request.postDataJSON().version).toBe(1);
        expect(request.headers()["content-type"]).toContain("application/json");
        imported = true;
        return route.fulfill({
          status: 201,
          json: { ...trip, id: "9223372036854775802", name: "Копия" },
        });
      }
      return route.fulfill({ status: 404, json: {} });
    });
    await page.route("**/*tile*", (route) => route.abort());
    await page.goto("/trips");
    await page.getByRole("button", { name: "Меню аккаунта" }).click();
    await page.getByRole("menuitem", { name: "Настройки аккаунта" }).click();
    const drive = page.getByRole("region", { name: "Google Drive" });
    await expect(drive.getByText("Подключён", { exact: true })).toBeVisible();
    await page.screenshot({
      path: `test-results/${viewport.width}-drive-settings.png`,
    });
    await drive.getByRole("button", { name: "Отключить Google Drive" }).click();
    await expect(
      drive.getByRole("button", { name: "Подключить Google Drive" }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Закрыть окно", exact: true })
      .click();
    const actions = page.getByRole("button", {
      name: "Действия с путешествием «Казань»",
    });
    await actions.click();
    const download = page.waitForEvent("download");
    await page.getByRole("menuitem", { name: "Скачать JSON" }).click();
    expect((await download).suggestedFilename()).toBe(`trip-${trip.id}.json`);
    await expect(page.getByText("JSON скачан.", { exact: true })).toBeVisible();
    await actions.click();
    await page.getByRole("menuitem", { name: "Импортировать билет" }).click();
    const dialog = page.getByRole("dialog").filter({
      has: page.getByRole("heading", { name: "Импортировать билет" }),
    });
    await expect(dialog).toBeVisible();
    const bounds = await dialog.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds?.height).toBeLessThan(550);
    expect(
      Math.abs(
        (bounds?.y ?? 0) + (bounds?.height ?? 0) / 2 - viewport.height / 2,
      ),
    ).toBeLessThan(2);
    const footer = await dialog.locator("form > div").last().boundingBox();
    expect(footer).not.toBeNull();
    expect(
      (bounds?.y ?? 0) +
        (bounds?.height ?? 0) -
        ((footer?.y ?? 0) + (footer?.height ?? 0)),
    ).toBeLessThan(5);
    await dialog.getByRole("combobox", { name: "Источник" }).click();
    await page.getByRole("option", { name: "HTTPS-ссылка" }).click();
    await dialog
      .getByLabel("Ссылка на билет")
      .fill("https://tickets.example/stay.pdf");
    await dialog
      .getByRole("button", { name: "Распознать", exact: true })
      .click();
    await expect(dialog.getByRole("alert")).toHaveText(
      "Не удалось определить вид билета. Выберите его вручную и повторите распознавание.",
    );
    await expect(
      dialog.getByRole("combobox", { name: "Вид билета" }),
    ).toHaveAttribute("aria-invalid", "true");
    await dialog.getByRole("combobox", { name: "Вид билета" }).click();
    await page.getByRole("option", { name: "Проживание" }).click();
    await expect(dialog.getByRole("alert")).toHaveCount(0);
    await dialog
      .getByRole("button", { name: "Распознать", exact: true })
      .click();
    await expect(dialog.getByLabel("Название")).toHaveValue("Отель");
    await expect(dialog.locator(".leaflet-container")).toBeVisible();
    await page.mouse.move(0, 0);
    await expect(page.getByRole("status")).toHaveCount(0);
    await expect(
      dialog.getByRole("button", { name: "Добавить в поездку" }),
    ).toBeEnabled();
    await page.screenshot({
      path: `test-results/${viewport.width}-ticket-preview.png`,
    });
    expect(applied).toBe(false);
    await dialog.getByRole("button", { name: "Добавить в поездку" }).click();
    await expect(dialog).not.toBeVisible();
    expect(applied).toBe(true);
    await page
      .locator('input[type="file"][accept="application/json,.json"]')
      .setInputFiles({
        name: "trip.json",
        mimeType: "application/json",
        buffer: Buffer.from(
          JSON.stringify({
            version: 1,
            trip: { name: "Копия", startedOn: trip.startedOn },
            points: [],
            events: [],
            transfers: [],
          }),
        ),
      });
    await expect(page).toHaveURL(/\/dashboard/);
    expect(imported).toBe(true);
    await page.screenshot({
      path: `test-results/${viewport.width}-integrations.png`,
    });
  });
}
