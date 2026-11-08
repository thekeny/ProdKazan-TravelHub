"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import * as sdk from "@/api/generated/sdk.gen";
import type {
  GoogleDriveConnection,
  GoogleDriveExport,
} from "@/api/generated/types.gen";
import { INTEGRATIONS } from "@/configs/consts/integrations.const";
import type { Material } from "@/configs/types/material.type";
import { useOnline } from "@/lib/connectivity";
import { drivePhoto } from "@/lib/google-drive";
import { ApiError, apiId, apiResult } from "@/lib/travel-api";

type Operation = {
  key: string;
  file: File;
  exportId?: string;
  result?: GoogleDriveExport;
};
type DriveContextValue = {
  status: GoogleDriveConnection | null;
  pending: boolean;
  error: string | null;
  online: boolean;
  refresh: () => Promise<void>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  exportPhoto: (
    material: Material,
    fresh?: boolean,
  ) => Promise<GoogleDriveExport>;
  checkPhoto: (materialId: string) => Promise<GoogleDriveExport>;
  operations: ReadonlyMap<string, Operation>;
};
const DriveContext = createContext<DriveContextValue | null>(null);
export function useDrive() {
  return useContext(DriveContext);
}

export function DriveProvider({
  children,
  onRequestError,
}: {
  children: React.ReactNode;
  onRequestError: (error: unknown, foreground: boolean) => void;
}) {
  const [status, setStatus] = useState<GoogleDriveConnection | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const operations = useRef(new Map<string, Operation>());
  const [, setRevision] = useState(0);
  const busy = useRef(false);
  const mounted = useRef(true);
  const retryAt = useRef(0);
  const online = useOnline();
  const report = useRef(onRequestError);
  report.current = onRequestError;
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  async function refresh() {
    setStatus(await apiResult(sdk.googleDriveStatus()));
  }
  useEffect(() => {
    let active = true;
    if (!online) return;
    apiResult(sdk.googleDriveStatus())
      .then((value) => {
        if (active) setStatus(value);
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(
            reason instanceof Error
              ? reason.message
              : "Не удалось проверить Drive.",
          );
          report.current(reason, false);
        }
      });
    const url = new URL(window.location.href);
    const result = url.searchParams.get("googleDrive");
    if (
      url.pathname === "/dashboard" &&
      ["connected", "denied"].includes(result ?? "")
    ) {
      if (result === "connected") toast.success("Google Drive подключён.");
      else toast.error("Подключение Google Drive отменено.");
      url.searchParams.delete("googleDrive");
      window.history.replaceState(
        window.history.state,
        "",
        `${url.pathname}${url.search}${url.hash}`,
      );
    }
    return () => {
      active = false;
    };
  }, [online]);
  async function action<T>(operation: () => Promise<T>) {
    if (busy.current)
      throw new Error("Дождитесь завершения операции с Google Drive.");
    if (!online) throw new Error("Для Google Drive нужен интернет.");
    if (Date.now() < retryAt.current)
      throw new Error(
        "Слишком много запросов. Повторите после указанной сервером паузы.",
      );
    busy.current = true;
    setPending(true);
    setError(null);
    try {
      return await operation();
    } catch (reason) {
      if (!mounted.current) throw reason;
      if (reason instanceof ApiError && reason.status === 429)
        retryAt.current =
          reason.retryAt && Number.isFinite(reason.retryAt)
            ? reason.retryAt
            : Date.now() + INTEGRATIONS.retryDelayMs;
      setError(
        reason instanceof Error
          ? reason.message
          : "Не удалось выполнить операцию Google Drive.",
      );
      report.current(reason, true);
      throw reason;
    } finally {
      busy.current = false;
      setPending(false);
      setRevision((value) => value + 1);
    }
  }
  const value: DriveContextValue = {
    status,
    pending,
    error,
    online,
    operations: new Map(operations.current),
    refresh: () => action(refresh),
    connect: () =>
      action(async () => {
        const { authorizationUrl } = await apiResult(sdk.googleDriveConnect());
        const destination = new URL(authorizationUrl);
        if (
          destination.protocol !== "https:" ||
          destination.hostname !== "accounts.google.com"
        )
          throw new Error("Сервер вернул некорректный адрес Google.");
        window.location.assign(destination.href);
      }),
    disconnect: () =>
      action(async () => {
        await apiResult(sdk.googleDriveDisconnect());
        await refresh();
      }),
    exportPhoto: (material, fresh = false) =>
      action(async () => {
        let operation = operations.current.get(material.id);
        if (!operation || fresh) {
          operation = {
            key: crypto.randomUUID(),
            file: await drivePhoto(material),
          };
          operations.current.set(material.id, operation);
        }
        try {
          const result = await apiResult(
            sdk.googleDriveExportPhoto({
              body: { file: operation.file },
              headers: { "idempotency-key": operation.key },
            }),
          );
          operation.result = result;
          operation.exportId = result.id;
          return result;
        } catch (reason) {
          if (
            reason instanceof ApiError &&
            typeof reason.detail === "object" &&
            reason.detail &&
            "exportId" in reason.detail &&
            typeof reason.detail.exportId === "string"
          )
            operation.exportId = reason.detail.exportId;
          throw reason;
        }
      }),
    checkPhoto: (id) =>
      action(async () => {
        const operation = operations.current.get(id);
        if (!operation?.exportId)
          throw new Error(
            "Сервер ещё не вернул ID экспорта. Повторите отправку.",
          );
        const result = await apiResult(
          sdk.googleDriveExportStatus({
            path: { export_id: apiId(operation.exportId) },
          }),
        );
        operation.result = result;
        return result;
      }),
  };
  return (
    <DriveContext.Provider value={value}>{children}</DriveContext.Provider>
  );
}
