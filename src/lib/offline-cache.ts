import type { User } from "@/api/generated/types.gen";
import type { TravelData } from "@/configs/types/travel.type";

const DATABASE = "travelhub-offline-v1";
const STORE = "snapshots";
const ACCOUNT_KEY = "travelhub-offline-account-v1";
type Snapshot = { user: User; data: TravelData };
let revision = 0;
let queue: Promise<void> = Promise.resolve();

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("Offline storage is blocked"));
  });
}

export function saveOfflineSnapshot(user: User, data: TravelData) {
  const expected = revision;
  const account = user.id ?? user.username;
  const operation = queue
    .catch(() => {})
    .then(async () => {
      if (expected !== revision) return;
      const db = await openDatabase();
      try {
        await new Promise<void>((resolve, reject) => {
          const transaction = db.transaction(STORE, "readwrite");
          // Keep only the current account on shared devices.
          const store = transaction.objectStore(STORE);
          store.clear();
          store.put({ user, data } satisfies Snapshot, account);
          transaction.oncomplete = () => resolve();
          transaction.onerror = transaction.onabort = () =>
            reject(transaction.error);
        });
        if (expected === revision) localStorage.setItem(ACCOUNT_KEY, account);
      } finally {
        db.close();
      }
    });
  queue = operation;
  return operation;
}

export async function readOfflineSnapshot(
  account?: string,
): Promise<Snapshot | null> {
  try {
    await queue.catch(() => {});
    const key = localStorage.getItem(ACCOUNT_KEY);
    if (!key || (account !== undefined && account !== key)) return null;
    const db = await openDatabase();
    try {
      const snapshot = await new Promise<Snapshot | undefined>(
        (resolve, reject) => {
          const request = db.transaction(STORE).objectStore(STORE).get(key);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        },
      );
      if (
        !snapshot ||
        (snapshot.user.id ?? snapshot.user.username) !== key ||
        !Array.isArray(snapshot.data.trips)
      )
        return null;
      return snapshot;
    } finally {
      db.close();
    }
  } catch {
    return null;
  }
}

export function clearOfflineSnapshot() {
  revision++;
  try {
    localStorage.removeItem(ACCOUNT_KEY);
  } catch {
    /* Storage may be blocked. */
  }
  queue = queue
    .catch(() => {})
    .then(async () => {
      const db = await openDatabase();
      try {
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(STORE, "readwrite");
          tx.objectStore(STORE).clear();
          tx.oncomplete = () => resolve();
          tx.onerror = tx.onabort = () => reject(tx.error);
        });
      } finally {
        db.close();
      }
    });
  return queue.catch(() => {});
}
