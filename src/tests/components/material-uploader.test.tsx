import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { MaterialUploader } from "@/components/materials/material-uploader";

const uploads = vi.hoisted(() => ({ upload: vi.fn(), toast: vi.fn() }));
vi.mock("@/lib/material-upload", () => ({ uploadMaterial: uploads.upload }));
vi.mock("@/lib/action-toast", () => ({ actionToast: uploads.toast }));
let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.resetAllMocks();
  uploads.toast.mockImplementation((action: () => unknown) => action());
  uploads.upload.mockImplementation(async (file: File, kind: string) => ({
    id: file.name,
    name: file.name,
    kind,
  }));
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});
async function select(files: File[]) {
  const input = container.querySelector('input[type="file"]');
  Object.defineProperty(input, "files", { configurable: true, value: files });
  await act(async () =>
    input?.dispatchEvent(new Event("change", { bubbles: true })),
  );
}

it("uses one toast for a batch and keeps successful files when another upload fails", async () => {
  const added = vi.fn();
  const error = vi.fn();
  const busy = vi.fn();
  uploads.upload.mockRejectedValueOnce(new Error("Нет места"));
  await act(async () =>
    root.render(
      <MaterialUploader
        kind="document"
        remaining={20}
        onUploaded={added}
        onError={error}
        onBusyChange={busy}
      />,
    ),
  );
  await select([
    new File(["x"], "failed.png", { type: "image/png" }),
    new File(["y"], "ticket.png", { type: "image/png" }),
  ]);
  expect(uploads.toast).toHaveBeenCalledTimes(1);
  expect(added).toHaveBeenCalledTimes(1);
  expect(added).toHaveBeenCalledWith(
    expect.objectContaining({ name: "ticket.png", kind: "document" }),
  );
  expect(error).toHaveBeenLastCalledWith("failed.png: Нет места");
  expect(busy.mock.calls).toEqual([[true], [false]]);
  expect(
    container.querySelector<HTMLInputElement>('input[type="file"]')?.value,
  ).toBe("");
});

it("reports all-invalid batches without adding materials and resets the picker after exceeding the total limit", async () => {
  const added = vi.fn();
  const error = vi.fn();
  await act(async () =>
    root.render(
      <MaterialUploader
        kind="photo"
        remaining={1}
        onUploaded={added}
        onError={error}
      />,
    ),
  );
  await select([new File(["x"], "bad.txt", { type: "text/plain" })]);
  expect(uploads.upload).not.toHaveBeenCalled();
  expect(added).not.toHaveBeenCalled();
  expect(error).toHaveBeenLastCalledWith(expect.stringContaining("bad.txt:"));
  await select([
    new File(["x"], "a.png", { type: "image/png" }),
    new File(["x"], "b.png", { type: "image/png" }),
  ]);
  expect(error).toHaveBeenLastCalledWith(
    "Можно добавить не более 1 материалов.",
  );
  expect(
    container.querySelector<HTMLInputElement>('input[type="file"]')?.value,
  ).toBe("");
});
