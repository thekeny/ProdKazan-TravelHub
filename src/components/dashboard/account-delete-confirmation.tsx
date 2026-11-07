"use client";

import { useState } from "react";
import { FormProvider } from "react-hook-form";
import { ConfirmDelete } from "@/components/ui/confirm-delete";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { TEXT_LIMITS } from "@/configs/consts/validation.const";
import { useFormValues } from "@/hooks/use-form-values";
import { actionToast } from "@/lib/action-toast";
import { ApiError } from "@/lib/travel-api";
import { useTravel } from "@/providers/travel-provider";

export function AccountDeleteConfirmation({
  onClose,
}: {
  onClose: () => void;
}) {
  const { remote, deleteAccount } = useTravel();
  const [values, setValues, form] = useFormValues(
    { password: "" },
    (values) => ({
      password:
        remote && !values.password ? "Введите текущий пароль." : undefined,
    }),
  );
  const [error, setError] = useState<string | null>(null);

  return (
    <FormProvider {...form}>
      <ConfirmDelete
        open
        title="Удалить аккаунт?"
        onClose={onClose}
        onConfirm={async () => {
          if (!(await form.trigger(undefined, { shouldFocus: true }))) return;
          setError(null);
          try {
            await actionToast(
              () => deleteAccount(values.password),
              "Удаляем аккаунт…",
              "Аккаунт удалён.",
            );
            onClose();
          } catch (error) {
            if (error instanceof ApiError && error.status === 403)
              form.setError(
                "password",
                { message: error.message },
                { shouldFocus: true },
              );
            else
              setError(
                error instanceof Error
                  ? error.message
                  : "Не удалось удалить аккаунт.",
              );
          }
        }}
        content={
          <div className="mt-4 grid gap-4">
            {remote && (
              <Field name="password" label="Текущий пароль">
                {(id) => (
                  <Input
                    data-field-control
                    id={id}
                    type="password"
                    autoComplete="current-password"
                    maxLength={TEXT_LIMITS.REMOTE_PASSWORD}
                    value={values.password}
                    onChange={(event) =>
                      setValues({ password: event.target.value })
                    }
                  />
                )}
              </Field>
            )}
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
        }
      >
        {remote
          ? "Аккаунт будет удалён без возможности восстановления. Вы потеряете доступ к своим поездкам. Для подтверждения введите пароль."
          : "Локальный аккаунт и все его поездки будут удалены из этого браузера без возможности восстановления. В локальном режиме пароль не используется."}
      </ConfirmDelete>
    </FormProvider>
  );
}
