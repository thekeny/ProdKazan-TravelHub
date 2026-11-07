"use client";
import { Dialog } from "@base-ui/react/dialog";
import { Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { FormProvider } from "react-hook-form";
import { AccountDeleteConfirmation } from "@/components/dashboard/account-delete-confirmation";
import { PushSettings } from "@/components/dashboard/push-settings";
import { Button } from "@/components/ui/button";
import { DialogPopup } from "@/components/ui/dialog-popup";
import { Field } from "@/components/ui/field";
import { Input, inputClass } from "@/components/ui/input";
import { TEXT_LIMITS } from "@/configs/consts/validation.const";
import { useDiscardConfirmation } from "@/hooks/use-discard-confirmation";
import { useFormValues } from "@/hooks/use-form-values";
import { actionToast } from "@/lib/action-toast";
import { authErrors, passwordErrors } from "@/lib/form-validation";
import { ApiError } from "@/lib/travel-api";
import { usePush } from "@/providers/push-provider";
import { useTravel } from "@/providers/travel-provider";
export function UserSettings({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved?: () => void;
}) {
  const { username, renameAccount, changePassword, remote, user } = useTravel();
  const push = usePush();
  const [values, setValues, form] = useFormValues(
    {
      username: username ?? "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    (values) =>
      remote
        ? passwordErrors(values)
        : {
            username: authErrors(
              { ...values, password: "", confirm: "" },
              false,
              false,
            ).username,
          },
  );
  const name = values.username;
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);
  const [deleting, setDeleting] = useState(false);
  const { requestClose, confirmation } = useDiscardConfirmation(
    values,
    onClose,
    pending || deleting || Boolean(push?.pending),
  );
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) requestClose();
      }}
    >
      {confirmation}
      {deleting && (
        <AccountDeleteConfirmation onClose={() => setDeleting(false)} />
      )}
      <Dialog.Portal>
        <Dialog.Backdrop className="dialog-backdrop fixed inset-0 z-[60] bg-overlay/35" />
        <DialogPopup className="dialog-popup fixed inset-0 z-[60] m-auto h-fit max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-xl border bg-background p-6">
          <Dialog.Title className="pr-10 text-xl">
            Настройки пользователя
          </Dialog.Title>
          <FormProvider {...form}>
            <form
              noValidate
              className="mt-6 grid gap-4"
              onSubmit={async (event) => {
                event.preventDefault();
                if (pendingRef.current) return;
                if (!(await form.trigger(undefined, { shouldFocus: true })))
                  return;
                if (pendingRef.current) return;
                pendingRef.current = true;
                setPending(true);
                setError(null);
                try {
                  await actionToast(
                    () =>
                      remote
                        ? changePassword(
                            values.currentPassword,
                            values.newPassword,
                          )
                        : renameAccount(name),
                    "Сохраняем…",
                    remote ? "Пароль изменён." : "Изменения сохранены.",
                  );
                  onSaved?.();
                  onClose();
                } catch (error) {
                  if (
                    remote &&
                    error instanceof ApiError &&
                    error.status === 403
                  ) {
                    form.setError(
                      "currentPassword",
                      { message: error.message },
                      { shouldFocus: true },
                    );
                  } else
                    setError(
                      error instanceof Error
                        ? error.message
                        : "Не удалось сохранить изменения.",
                    );
                } finally {
                  pendingRef.current = false;
                  setPending(false);
                }
              }}
            >
              <Field
                name="username"
                label="Имя пользователя"
                hint={remote ? "Изменение имени пока недоступно." : undefined}
              >
                {(id) => (
                  <Input
                    data-field-control
                    id={id}
                    className={inputClass}
                    value={name}
                    readOnly={remote}
                    disabled={pending}
                    required
                    minLength={TEXT_LIMITS.USERNAME_MIN}
                    maxLength={TEXT_LIMITS.USERNAME}
                    autoComplete="username"
                    onChange={(event) =>
                      setValues({ ...values, username: event.target.value })
                    }
                  />
                )}
              </Field>
              {remote ? (
                <>
                  <Field name="currentPassword" label="Текущий пароль">
                    {(id) => (
                      <Input
                        data-field-control
                        id={id}
                        type="password"
                        className={inputClass}
                        value={values.currentPassword}
                        disabled={pending}
                        autoComplete="current-password"
                        maxLength={TEXT_LIMITS.REMOTE_PASSWORD}
                        onChange={(event) =>
                          setValues({
                            ...values,
                            currentPassword: event.target.value,
                          })
                        }
                      />
                    )}
                  </Field>
                  <Field
                    name="newPassword"
                    label="Новый пароль"
                    hint={`От ${TEXT_LIMITS.PASSWORD_MIN} до ${TEXT_LIMITS.REMOTE_PASSWORD} символов.`}
                  >
                    {(id, describedBy) => (
                      <Input
                        data-field-control
                        id={id}
                        type="password"
                        className={inputClass}
                        value={values.newPassword}
                        disabled={pending}
                        autoComplete="new-password"
                        aria-describedby={describedBy}
                        minLength={TEXT_LIMITS.PASSWORD_MIN}
                        maxLength={TEXT_LIMITS.REMOTE_PASSWORD}
                        onChange={(event) =>
                          setValues({
                            ...values,
                            newPassword: event.target.value,
                          })
                        }
                      />
                    )}
                  </Field>
                  <Field name="confirmPassword" label="Повторите новый пароль">
                    {(id) => (
                      <Input
                        data-field-control
                        id={id}
                        type="password"
                        className={inputClass}
                        value={values.confirmPassword}
                        disabled={pending}
                        autoComplete="new-password"
                        maxLength={TEXT_LIMITS.REMOTE_PASSWORD}
                        onChange={(event) =>
                          setValues({
                            ...values,
                            confirmPassword: event.target.value,
                          })
                        }
                      />
                    )}
                  </Field>
                </>
              ) : (
                <Field
                  name="password"
                  label="Пароль"
                  hint={
                    "Смена пароля станет доступна после подключения авторизации."
                  }
                >
                  {(id, describedBy) => (
                    <Input
                      data-field-control
                      id={id}
                      type="password"
                      disabled
                      className={inputClass}
                      aria-describedby={describedBy}
                    />
                  )}
                </Field>
              )}
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
                <Button type="submit" disabled={pending}>
                  {pending
                    ? "Сохраняем…"
                    : remote
                      ? "Изменить пароль"
                      : "Сохранить"}
                </Button>
              </div>
            </form>
          </FormProvider>
          {remote && <PushSettings />}
          <div className="mt-6 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              className="text-destructive hover:text-destructive"
              disabled={pending || Boolean(push?.pending)}
              onClick={() => setDeleting(true)}
            >
              <Trash2 aria-hidden="true" />
              Удалить аккаунт
            </Button>
          </div>
        </DialogPopup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
