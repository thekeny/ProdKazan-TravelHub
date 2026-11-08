import { expect, test } from "@playwright/test";

test("opens saved data offline with a trailing slash and after reload", async ({
  context,
  page,
}) => {
  // Never contact the backend: this test isolates the cached app and snapshot.
  await context.route("**/api/v1/**", (route) => route.abort());
  await page.goto("/");
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("travelhub-offline-v1", 1);
      request.onupgradeneeded = () =>
        request.result.createObjectStore("snapshots");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction("snapshots", "readwrite");
      transaction.objectStore("snapshots").put(
        {
          user: { id: "123", username: "traveler" },
          data: { trips: [], activeId: null },
        },
        "123",
      );
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    db.close();
    localStorage.setItem("travelhub-offline-account-v1", "123");
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller)
      await new Promise<void>((resolve) =>
        navigator.serviceWorker.addEventListener(
          "controllerchange",
          () => resolve(),
          { once: true },
        ),
      );
  });
  await context.setOffline(true);
  await page.goto("/trips/");
  await expect(page.getByText("Вы оффлайн", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Ваши путешествия" }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByText("Вы оффлайн", { exact: true })).toBeVisible();
});
