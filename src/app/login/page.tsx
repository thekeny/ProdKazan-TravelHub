"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { images } from "@/configs/paths/images.path";
import { pages } from "@/configs/paths/pages.path";
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
  const errorId = useId();
  useEffect(() => {
    if (ready && username) router.replace(pages.TRIPS);
  }, [ready, username, router]);
  return (
    <main className="flow-background">
      <section className="flow-card relative grid w-full max-w-4xl overflow-hidden rounded-[2rem] p-0 lg:grid-cols-[0.85fr_1.15fr]">
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

        <div className="p-6 sm:p-10">
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
                onClick={() => {
                  setMode(value);
                  setError(null);
                }}
              >
                {label}
              </Button>
            ))}
          </div>
          <form
            key={mode}
            className="mt-6 grid gap-4"
            onSubmit={async (event) => {
              event.preventDefault();
              setError(null);
              const values = new FormData(event.currentTarget);
              const name = String(values.get("username")).trim();
              if (name.length < 3 || name.length > 32) {
                setError(
                  "Имя пользователя должно содержать от 3 до 32 символов.",
                );
                return;
              }
              if (
                mode === "register" &&
                values.get("password") !== values.get("confirm")
              ) {
                setError("Пароли не совпадают.");
                return;
              }
              if (pending) return;
              setPending(true);
              try {
                await login(
                  name,
                  String(values.get("password") ?? ""),
                  mode === "register",
                );
                router.replace(pages.TRIPS);
              } catch (error) {
                setError(
                  error instanceof Error ? error.message : "Не удалось войти.",
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
                  name="username"
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
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? errorId : undefined}
                />
              )}
            </Field>
            <Field label="Пароль">
              {(id) => (
                <input
                  id={id}
                  className={inputClass}
                  name="password"
                  type="password"
                  required={remote || mode === "register"}
                  minLength={mode === "register" ? 8 : undefined}
                  maxLength={remote ? 64 : 128}
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? errorId : undefined}
                />
              )}
            </Field>
            {mode === "register" && (
              <Field label="Повторите пароль">
                {(id) => (
                  <input
                    id={id}
                    className={inputClass}
                    name="confirm"
                    type="password"
                    required
                    minLength={8}
                    maxLength={remote ? 64 : 128}
                    autoComplete="new-password"
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? errorId : undefined}
                  />
                )}
              </Field>
            )}
            {(error || storageWarning) && (
              <p id={errorId} role="alert" className="text-sm text-destructive">
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
        </div>
      </section>
    </main>
  );
}
