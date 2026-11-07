"use client";

import { RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { pages } from "@/configs/paths/pages.path";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-4 py-10">
      <section className="w-full max-w-md rounded-xl border bg-card p-6 text-center sm:p-8">
        <p className="text-sm font-medium text-destructive">
          Что-то пошло не так
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Не удалось открыть страницу
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Повторите действие. Если ошибка повторится, вернитесь к путешествиям.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button className="h-11 flex-1" onClick={reset}>
            <RefreshCw />
            Повторить
          </Button>
          <Link
            href={pages.TRIPS}
            className={buttonVariants({
              variant: "outline",
              className: "h-11 flex-1",
            })}
          >
            К путешествиям
          </Link>
        </div>
      </section>
    </main>
  );
}
