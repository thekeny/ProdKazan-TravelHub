import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { UserSettings } from "@/components/dashboard/user-settings";
import { ApiError } from "@/lib/travel-api";

const account = vi.hoisted(() => ({
  username: "traveler",
  remote: true,
  changePassword: vi.fn(),
  renameAccount: vi.fn(),
  deleteAccount: vi.fn(),
}));
vi.mock("@/providers/travel-provider", () => ({ useTravel: () => account }));
vi.mock("@/lib/action-toast", () => ({
  actionToast: (action: () => Promise<void>) => action(),
}));

let root: Root;
let container: HTMLDivElement;
const onClose = vi.fn();
beforeEach(async () => {
  vi.resetAllMocks();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => root.render(<UserSettings onClose={onClose} />));
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

async function fill(confirmPassword = "new-pass") {
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  )?.set;
  for (const [name, value] of Object.entries({
    currentPassword: "old-pass",
    newPassword: "new-pass",
    confirmPassword,
  })) {
    await act(async () => {
      const input = document.querySelector(`input[name="${name}"]`);
      setter?.call(input, value);
      input?.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }
}
async function submit() {
  await act(async () => {
    document
      .querySelector("form")
      ?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
}

it("requires a password in the deletion confirmation and keeps it open on failure", async () => {
  await act(async () => {
    Array.from(document.querySelectorAll("button"))
      .find((button) => button.textContent === "Удалить аккаунт")
      ?.click();
  });
  const confirm = () =>
    Array.from(document.querySelectorAll("button")).find(
      (button) => button.textContent === "Удалить",
    );
  await act(async () => confirm()?.click());
  expect(account.deleteAccount).not.toHaveBeenCalled();
  expect(document.body.textContent).toContain("Введите текущий пароль.");
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  )?.set;
  await act(async () => {
    const input = document.querySelector('input[name="password"]');
    setter?.call(input, "wrong-password");
    input?.dispatchEvent(new Event("input", { bubbles: true }));
  });
  account.deleteAccount.mockRejectedValueOnce(
    new ApiError(403, "Неверный текущий пароль."),
  );
  await act(async () => confirm()?.click());
  expect(account.deleteAccount).toHaveBeenCalledExactlyOnceWith(
    "wrong-password",
  );
  expect(
    document
      .querySelector('input[name="password"]')
      ?.getAttribute("aria-invalid"),
  ).toBe("true");
  expect(onClose).not.toHaveBeenCalled();
});

it("requires matching new passwords before sending the request", async () => {
  await fill("different-pass");
  await submit();
  expect(document.body.textContent).toContain("Пароли не совпадают.");
  expect(account.changePassword).not.toHaveBeenCalled();
  expect(onClose).not.toHaveBeenCalled();
});

it("submits only current and new passwords and closes on success", async () => {
  await fill();
  await submit();
  expect(account.changePassword).toHaveBeenCalledExactlyOnceWith(
    "old-pass",
    "new-pass",
  );
  expect(account.renameAccount).not.toHaveBeenCalled();
  expect(onClose).toHaveBeenCalledOnce();
});

it("shows an incorrect current password at the field and allows retrying", async () => {
  account.changePassword.mockRejectedValueOnce(
    new ApiError(403, "Неверный текущий пароль."),
  );
  await fill();
  await submit();
  const input = document.querySelector('input[name="currentPassword"]');
  expect(input?.getAttribute("aria-invalid")).toBe("true");
  expect(document.body.textContent).toContain("Неверный текущий пароль.");
  expect(onClose).not.toHaveBeenCalled();
  await submit();
  expect(account.changePassword).toHaveBeenCalledTimes(2);
  expect(onClose).toHaveBeenCalledOnce();
});

it("blocks repeated submissions and closing while saving", async () => {
  let finish: (() => void) | undefined;
  account.changePassword.mockImplementation(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  await fill();
  await submit();
  await submit();
  await act(async () => {
    const close = Array.from(document.querySelectorAll("button")).find(
      (button) => button.textContent === "Закрыть",
    );
    close?.click();
  });
  expect(account.changePassword).toHaveBeenCalledOnce();
  expect(onClose).not.toHaveBeenCalled();
  await act(async () => finish?.());
  expect(onClose).toHaveBeenCalledOnce();
});
