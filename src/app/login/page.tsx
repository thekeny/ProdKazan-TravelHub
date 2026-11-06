"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { pages } from "@/configs/paths/pages.path";
import { useTravel } from "@/providers/travel-provider";
export default function Page() {
  const { ready, username, login, storageWarning } = useTravel();
  const router = useRouter();
  const [mode, setMode] = useState("login");
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (ready && username) router.replace(pages.TRIPS);
  }, [ready, username, router]);
  return (
    <main className="flow-background">
      <section className="flow-card">
        <div className="flex justify-center">
          <Logo />
        </div>
        <h1 className="mt-9 text-2xl font-semibold tracking-tight">
          {mode === "login" ? "С возвращением" : "Создать аккаунт"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ваши путешествия в одном месте.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
          {[
            ["login", "Вход"],
            ["register", "Регистрация"],
          ].map(([value, label]) => (
            <Button
              key={value}
              variant="ghost"
              aria-pressed={mode === value}
              className={`h-10 ${mode === value ? "bg-white shadow-sm" : ""}`}
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
            if (name.length < 3) {
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
                required
                minLength={8}
                maxLength={128}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
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
                />
              )}
            </Field>
          )}
          {(error || storageWarning) && (
            <p role="alert" className="text-sm text-destructive">
              {error || storageWarning}
            </p>
          )}
          <Button type="submit" disabled={!ready} className="mt-2 h-11">
            {mode === "login" ? "Войти" : "Зарегистрироваться"}
          </Button>
        </form>
        <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
          Демоверсия: вход без проверки пароля. Данные сохраняются только в этом
          браузере. Используйте вымышленный пароль.
        </p>
      </section>
    </main>
  );
}
