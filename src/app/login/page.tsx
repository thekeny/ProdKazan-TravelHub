"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { FormProvider } from "react-hook-form";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { images } from "@/configs/paths/images.path";
import { pages } from "@/configs/paths/pages.path";
import { useFormValues } from "@/hooks/use-form-values";
import { actionToast } from "@/lib/action-toast";
import { authErrors } from "@/lib/form-validation";
import { useTravel } from "@/providers/travel-provider";

const MODES = [
  { value: "login", label: "Вход" },
  { value: "register", label: "Регистрация" },
] as const;

export default function Page() {
  const { ready, username, login, remote, storageWarning } = useTravel();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);
  const errorId = useId();
  const [values, setValues, form] = useFormValues(
    { username: "", password: "", confirm: "" },
    (values) => authErrors(values, Boolean(remote), mode === "register"),
  );
  useEffect(() => {
    document.title = mode === "login" ? "Вход" : "Регистрация";
  }, [mode]);
  useEffect(() => {
    if (ready && username) router.replace(pages.TRIPS);
  }, [ready, username, router]);
  return (
    <main className="flow-background !py-4">
      <section className="flow-card relative grid w-full max-w-4xl overflow-hidden rounded-[2rem] !p-0 lg:grid-cols-[0.85fr_1.15fr]">
        <aside className="relative hidden flex-col overflow-hidden bg-secondary p-8 lg:flex">
          <div>
            <Logo size="lg" />
          </div>
          <div className="relative mt-8 min-h-64 flex-1">
            <Image
              src={images.LOGIN_SIDEBAR}
              alt=""
              fill
              sizes="320px"
              priority
              className="object-contain"
            />
          </div>
        </aside>

        <div className="min-h-0 self-center p-6 sm:p-8">
          <div className="lg:hidden">
            <Logo />
          </div>
          <h1 className="mt-8 text-4xl leading-tight lg:mt-0">
            {mode === "login" ? "Вход" : "Регистрация"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "login"
              ? "Войдите, чтобы открыть свои поездки."
              : remote
                ? "Создайте аккаунт, чтобы сохранять поездки на сервере."
                : "Аккаунт создаётся в этом браузере."}
          </p>
          <div className="mt-6 grid grid-cols-2 gap-1 rounded-xl bg-muted/80 p-1">
            {MODES.map(({ value, label }) => (
              <Button
                key={value}
                variant="ghost"
                aria-pressed={mode === value}
                className={`h-10 rounded-lg ${mode === value ? "bg-surface  hover:bg-surface" : ""}`}
                disabled={pending}
                onClick={() => {
                  setMode(value);
                  form.clearErrors();
                  setValues((current) => ({
                    ...current,
                    password: "",
                    confirm: "",
                  }));
                  setError(null);
                }}
              >
                {label}
              </Button>
            ))}
          </div>
          <FormProvider {...form}>
            <form
              noValidate
              key={mode}
              className="mt-5 grid gap-2"
              onSubmit={async (event) => {
                event.preventDefault();
                setError(null);
                if (!(await form.trigger(undefined, { shouldFocus: true })))
                  return;
                const values = form.getValues();
                const name = values.username.trim();
                if (pendingRef.current) return;
                pendingRef.current = true;
                setPending(true);
                try {
                  await actionToast(
                    () => login(name, values.password, mode === "register"),
                    "Подождите…",
                    "Готово.",
                  );
                  router.replace(pages.TRIPS);
                } catch (error) {
                  setError(
                    error instanceof Error
                      ? error.message
                      : "Не удалось войти.",
                  );
                } finally {
                  pendingRef.current = false;
                  setPending(false);
                }
              }}
            >
              <Field name="username" label="Имя пользователя">
                {(id) => (
                  <input
                    id={id}
                    className={inputClass}
                    name="username"
                    value={values.username}
                    disabled={pending}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        username: event.target.value,
                      }))
                    }
                    required
                    minLength={3}
                    maxLength={32}
                    pattern={remote ? "[a-zA-Z0-9._]+" : undefined}
                    title={
                      remote
                        ? "Латинские буквы, цифры, точка и подчёркивание"
                        : undefined
                    }
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                  />
                )}
              </Field>
              <Field name="password" label="Пароль">
                {(id) => (
                  <input
                    id={id}
                    className={inputClass}
                    name="password"
                    value={values.password}
                    disabled={pending}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                    type="password"
                    required={remote || mode === "register"}
                    minLength={mode === "register" ? 8 : undefined}
                    maxLength={remote ? 64 : 128}
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                  />
                )}
              </Field>
              {mode === "register" && (
                <Field name="confirm" label="Повторите пароль">
                  {(id) => (
                    <input
                      id={id}
                      className={inputClass}
                      name="confirm"
                      value={values.confirm}
                      disabled={pending}
                      onChange={(event) =>
                        setValues((current) => ({
                          ...current,
                          confirm: event.target.value,
                        }))
                      }
                      type="password"
                      required
                      minLength={8}
                      maxLength={remote ? 64 : 128}
                      autoComplete="new-password"
                    />
                  )}
                </Field>
              )}
              {(error || storageWarning) && (
                <p
                  id={errorId}
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {error || storageWarning}
                </p>
              )}
              <Button
                type="submit"
                disabled={!ready || pending}
                className="mt-2 h-12"
              >
                {pending
                  ? "Подождите…"
                  : mode === "login"
                    ? "Войти"
                    : "Зарегистрироваться"}
              </Button>
            </form>
          </FormProvider>
        </div>
      </section>
    </main>
  );
}
