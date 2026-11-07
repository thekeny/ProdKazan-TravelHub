"use client";
import { Dialog } from "@base-ui/react/dialog";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DialogPopup } from "@/components/ui/dialog-popup";
import { Field, inputClass } from "@/components/ui/field";
import { useDiscardConfirmation } from "@/hooks/use-discard-confirmation";
import { useTravel } from "@/providers/travel-provider";
export function UserSettings({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const { username, renameAccount, remote, user } = useTravel();
  const [name, setName] = useState(username ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const { requestClose, confirmation } = useDiscardConfirmation(
    name,
    onClose,
    pending,
  );
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) requestClose();
      }}
    >
      {confirmation}
      <Dialog.Portal>
        <Dialog.Backdrop className="dialog-backdrop fixed inset-0 z-[60] bg-overlay/35" />
        <DialogPopup className="dialog-popup fixed inset-0 z-[60] m-auto h-fit max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-xl border bg-background p-6">
          <Dialog.Title className="pr-10 text-xl">
            Настройки пользователя
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-muted-foreground">
            {remote
              ? "Данные аккаунта загружены с сервера. Изменение имени и пароля пока не поддерживается API."
              : "Данные вашего аккаунта."}
          </Dialog.Description>
          <form
            className="mt-6 grid gap-5"
            onSubmit={async (event) => {
              event.preventDefault();
              if (pending || remote) return;
              setPending(true);
              try {
                await renameAccount(name);
                onSaved();
                onClose();
              } catch (error) {
                setError(
                  error instanceof Error
                    ? error.message
                    : "Не удалось сохранить имя.",
                );
              } finally {
                setPending(false);
              }
            }}
          >
            <Field label="Имя пользователя">
              {(id) => (
                <input
                  id={id}
                  className={inputClass}
                  value={name}
                  readOnly={remote}
                  required
                  minLength={3}
                  maxLength={32}
                  autoComplete="username"
                  onChange={(event) => setName(event.target.value)}
                />
              )}
            </Field>
            <Field
              label="Пароль"
              hint={
                remote
                  ? "В API пока нет метода смены пароля."
                  : "Смена пароля станет доступна после подключения авторизации."
              }
            >
              {(id, describedBy) => (
                <input
                  id={id}
                  type="password"
                  disabled
                  className={inputClass}
                  aria-describedby={describedBy}
                />
              )}
            </Field>
            {remote && user?.createdAt && (
              <p className="text-sm text-muted-foreground">
                Аккаунт создан:{" "}
                {new Date(user.createdAt).toLocaleDateString("ru-RU")}
              </p>
            )}
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={requestClose}>
                {remote ? "Закрыть" : "Отмена"}
              </Button>
              {!remote && (
                <Button type="submit" disabled={pending}>
                  Сохранить
                </Button>
              )}
            </div>
          </form>
        </DialogPopup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
