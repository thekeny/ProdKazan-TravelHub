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
  const { ready, username, login, storageWarning } = useTravel();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);
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
            <p className="mt-1 font-sans text-sm leading-snug text-foreground">
              Твоя история на карте
            </p>
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
            <p className="mt-1 font-sans text-sm leading-snug text-foreground">
              Твоя история на карте
            </p>
          </div>
          <h1 className="mt-8 text-4xl leading-tight lg:mt-0">
            {mode === "login" ? "Вход" : "Регистрация"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "login"
              ? "Войдите, чтобы открыть свои поездки."
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
            onSubmit={(event) => {
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
              try {
                login(name);
                router.replace(pages.TRIPS);
              } catch (error) {
                setError((error as Error).message);
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
                  required={mode === "register"}
                  minLength={mode === "register" ? 8 : undefined}
                  maxLength={128}
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
                    maxLength={128}
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
            <Button type="submit" disabled={!ready} className="mt-2 h-12">
              {mode === "login" ? "Войти" : "Зарегистрироваться"}
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}
