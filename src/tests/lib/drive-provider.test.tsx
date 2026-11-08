import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import * as sdk from "@/api/generated/sdk.gen";
import type { Material } from "@/configs/types/material.type";
import { setConnected } from "@/lib/connectivity";
import { disconnectDriveBeforeDeletion, drivePhoto } from "@/lib/google-drive";
import { DriveProvider, useDrive } from "@/providers/drive-provider";

vi.mock("@/api/generated/sdk.gen");
vi.mock("@/lib/google-drive", async (original) => ({
  ...(await original<typeof import("@/lib/google-drive")>()),
  drivePhoto: vi.fn(),
}));
const ok = <T,>(data: T) => ({
  data,
  error: undefined,
  response: new Response("{}"),
});
const material: Material = {
  id: "photo",
  name: "photo.webp",
  mimeType: "image/webp",
  size: 10,
  kind: "photo",
  createdAt: "2026-11-08",
};
const file = new File(["prepared bytes"], "photo.jpg", { type: "image/jpeg" });
const exported = {
  id: "9223372036854775806",
  name: "photo.jpg",
  mimeType: "image/jpeg",
  size: 14,
  status: "succeeded" as const,
  driveFileId: "file",
  webViewLink: "https://drive.google.com/file/test",
};
let root: Root;
let container: HTMLDivElement;
let drive: NonNullable<ReturnType<typeof useDrive>>;
function Probe() {
  const value = useDrive();
  if (value) drive = value;
  return null;
}
beforeEach(async () => {
  vi.resetAllMocks();
  setConnected(true);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.mocked(sdk.googleDriveStatus).mockResolvedValue(
    ok({ enabled: true, status: "connected" }),
  );
  vi.mocked(drivePhoto).mockResolvedValue(file);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () =>
    root.render(
      <DriveProvider onRequestError={() => undefined}>
        <Probe />
      </DriveProvider>,
    ),
  );
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

it("retries an uncertain export with the same prepared file and key, then uses a new key for a new copy", async () => {
  vi.mocked(sdk.googleDriveExportPhoto)
    .mockRejectedValueOnce(new TypeError("network interrupted"))
    .mockResolvedValue(ok(exported));
  await act(async () => {
    await expect(drive.exportPhoto(material)).rejects.toThrow(
      "network interrupted",
    );
  });
  await act(async () => {
    await drive.exportPhoto(material);
  });
  const calls = vi.mocked(sdk.googleDriveExportPhoto).mock.calls;
  expect(calls[1][0]).toEqual(calls[0][0]);
  expect(calls[1][0].body.file).toBe(file);
  expect(drivePhoto).toHaveBeenCalledOnce();
  expect(drive.operations.get(material.id)?.result?.webViewLink).toBe(
    exported.webViewLink,
  );
  await act(async () => {
    await drive.exportPhoto(material, true);
  });
  expect(calls[2][0].headers["idempotency-key"]).not.toBe(
    calls[0][0].headers["idempotency-key"],
  );
});

it("keeps exportId from an error and checks it without POSTing again", async () => {
  vi.mocked(sdk.googleDriveExportPhoto).mockResolvedValue({
    data: undefined,
    error: { detail: { exportId: exported.id } },
    response: new Response("{}", { status: 409 }),
  });
  vi.mocked(sdk.googleDriveExportStatus).mockResolvedValue(ok(exported));
  await act(async () => {
    await expect(drive.exportPhoto(material)).rejects.toThrow();
  });
  expect(sdk.googleDriveExportPhoto).toHaveBeenCalledOnce();
  await act(async () => {
    await drive.checkPhoto(material.id);
  });
  expect(sdk.googleDriveExportStatus).toHaveBeenCalledWith({
    path: { export_id: exported.id },
  });
  expect(sdk.googleDriveExportPhoto).toHaveBeenCalledOnce();
});

it("blocks account deletion until Drive revocation finishes", async () => {
  vi.mocked(sdk.googleDriveDisconnect).mockResolvedValue(
    ok({ enabled: true, status: "disconnected", revocationPending: true }),
  );
  vi.mocked(sdk.googleDriveStatus)
    .mockResolvedValueOnce(ok({ enabled: true, status: "connected" }))
    .mockResolvedValueOnce(
      ok({ enabled: true, status: "disconnected", revocationPending: true }),
    );
  await expect(disconnectDriveBeforeDeletion()).rejects.toThrow(
    "отключение Google Drive",
  );
  expect(sdk.googleDriveDisconnect).toHaveBeenCalledOnce();
});
