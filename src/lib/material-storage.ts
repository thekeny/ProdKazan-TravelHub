const DB_NAME = "travelhub-materials";
const DB_VERSION = 1;
const STORE_NAME = "files";

let databasePromise: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined")
    return Promise.reject(
      new Error("Браузер не поддерживает локальное хранилище файлов."),
    );
  if (databasePromise) return databasePromise;
  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME))
        database.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      databasePromise = null;
      reject(new Error("Не удалось открыть хранилище материалов."));
    };
    request.onblocked = () => {
      databasePromise = null;
      reject(new Error("Хранилище материалов занято другой вкладкой."));
    };
  });
  return databasePromise;
}

export async function putMaterialFile(id: string, blob: Blob): Promise<void> {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(blob, id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(new Error("Не удалось сохранить материал в браузере."));
    transaction.onabort = () =>
      reject(new Error("Сохранение материала было прервано."));
  });
}

export async function getMaterialFile(id: string): Promise<Blob | null> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).get(id);
    request.onsuccess = () =>
      resolve(request.result instanceof Blob ? request.result : null);
    request.onerror = () =>
      reject(new Error("Не удалось прочитать материал из хранилища."));
  });
}

export async function deleteMaterialFiles(
  ids: readonly string[],
): Promise<void> {
  if (!ids.length) return;
  try {
    const database = await openDatabase();
    await new Promise<void>((resolve) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      for (const id of ids) store.delete(id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => resolve();
      transaction.onabort = () => resolve();
    });
  } catch {
    // Удаление файлов — обслуживающая операция: не ломаем удаление события.
  }
}
