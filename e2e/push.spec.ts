import { expect, test } from "@playwright/test";

test("blocked permission shows instructions without prompting again", async ({
  page,
}) => {
  await page.route("**/api/v1/**", (route) =>
    route.fulfill({
      json: route.request().url().endsWith("/auth/refresh")
        ? { access_token: "fixture-token" }
        : route.request().url().endsWith("/auth/me")
          ? { id: "123", username: "traveler" }
          : [],
    }),
  );
  await page.addInitScript(() => {
    Object.defineProperty(window, "PushManager", {
      configurable: true,
      value: class {},
    });
    Object.defineProperty(window, "Notification", {
      configurable: true,
      value: {
        permission: "denied",
        requestPermission: () => {
          throw new Error("must not prompt");
        },
      },
    });
  });
  await page.goto("/trips");
  await expect(
    page.getByRole("complementary", { name: "Подключение уведомлений" }),
  ).not.toBeVisible();
  await page.getByRole("button", { name: "Меню аккаунта" }).click();
  await page.getByRole("menuitem", { name: "Настройки аккаунта" }).click();
  const settings = page.getByRole("region", { name: "Уведомления" });
  await expect(settings).toContainText("Уведомления запрещены");
  await expect(
    settings.getByRole("button", { name: "Включить уведомления" }),
  ).not.toBeVisible();
});

for (const [device, viewport] of Object.entries({
  desktop: { width: 1440, height: 1000 },
  mobile: { width: 390, height: 844 },
})) {
  test(`${device}: connect, test and disable push`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const registrations: unknown[] = [];
    const subscriptionId = "9223372036854775806";
    let keyAvailable = device !== "desktop";
    await page.route("**/api/v1/**", async (route) => {
      const request = route.request();
      const path = new URL(request.url()).pathname.replace("/api/v1", "");
      if (path === "/auth/refresh")
        return route.fulfill({ json: { access_token: "fixture-token" } });
      if (path === "/auth/me")
        return route.fulfill({ json: { id: "123", username: "traveler" } });
      if (path.replace(/\/$/, "") === "/trips")
        return route.fulfill({ json: [] });
      if (path === "/integrations/google-drive")
        return route.fulfill({ json: { enabled: false, status: "disabled" } });
      if (path === "/push/vapid-public-key") {
        if (!keyAvailable)
          return route.fulfill({
            status: 503,
            json: { detail: { reason: "push_key_unavailable" } },
          });
        return route.fulfill({
          json: {
            publicKey: Buffer.from([
              4,
              ...Array.from({ length: 64 }, (_, i) => i),
            ]).toString("base64url"),
          },
        });
      }
      if (path === "/push/subscriptions") {
        registrations.push(request.postDataJSON());
        return route.fulfill({ json: { id: subscriptionId } });
      }
      if (path === "/push/test") {
        expect(request.postDataJSON()).toEqual({ subscriptionId });
        return route.fulfill({ status: 202, body: "" });
      }
      if (path === `/push/subscriptions/${subscriptionId}`)
        return route.fulfill({ status: 204 });
      return route.fulfill({ status: 404, json: {} });
    });
    await page.addInitScript(() => {
      let permission: NotificationPermission = "default";
      let current: object | null = null;
      let serverKey: ArrayBuffer | null = null;
      const worker = {
        pushManager: {
          getSubscription: async () => current,
          subscribe: async (options: PushSubscriptionOptionsInit) => {
            serverKey = options.applicationServerKey as ArrayBuffer;
            current = {
              endpoint: "https://push.test/device",
              options: { applicationServerKey: serverKey },
              toJSON: () => ({
                endpoint: "https://push.test/device",
                keys: { p256dh: "key", auth: "auth" },
              }),
              unsubscribe: async () => {
                current = null;
                return true;
              },
            };
            return current;
          },
        },
      };
      Object.defineProperty(window, "PushManager", {
        configurable: true,
        value: class {},
      });
      Object.defineProperty(window, "Notification", {
        configurable: true,
        value: {
          get permission() {
            return permission;
          },
          requestPermission: async () => {
            permission = "granted";
            return permission;
          },
        },
      });
      Object.defineProperty(navigator, "serviceWorker", {
        configurable: true,
        value: {
          register: async () => worker,
          ready: Promise.resolve(worker),
          getRegistration: async () => worker,
        },
      });
    });
    await page.goto("/trips");
    await page.getByRole("button", { name: "Меню аккаунта" }).click();
    await page.getByRole("menuitem", { name: "Настройки аккаунта" }).click();
    const settings = page.getByRole("region", { name: "Уведомления" });
    const enable = settings.getByRole("button", {
      name: "Включить уведомления",
    });
    if (!keyAvailable) {
      await enable.click();
      await expect(settings.getByRole("alert")).toContainText(
        "На сервере не настроен ключ уведомлений",
      );
      keyAvailable = true;
    }
    await enable.click();
    await expect(settings).toContainText("Уведомления подключены");
    expect(registrations).toEqual([
      {
        endpoint: "https://push.test/device",
        keys: { p256Dh: "key", auth: "auth" },
      },
    ]);
    await settings.getByRole("button", { name: "Отправить тестовое" }).click();
    await expect(
      page
        .getByRole("status", { includeHidden: true })
        .filter({ hasText: "Тестовая отправка принята" }),
    ).toBeVisible();
    await page.screenshot({ path: `test-results/${device}-push.png` });
    await settings
      .getByRole("button", { name: "Отключить уведомления" })
      .click();
    await expect(
      settings.getByRole("button", { name: "Включить уведомления" }),
    ).toBeEnabled();
    await expect(
      settings.getByRole("button", { name: "Отправить тестовое" }),
    ).not.toBeVisible();
    expect(
      await page.evaluate(() =>
        localStorage.getItem("travelhub.push.disabled.123"),
      ),
    ).toBe("true");
    await page.reload();
    await page.getByRole("button", { name: "Меню аккаунта" }).click();
    await page.getByRole("menuitem", { name: "Настройки аккаунта" }).click();
    await expect(
      settings.getByRole("button", { name: "Включить уведомления" }),
    ).toBeEnabled();
  });
}
