import { Compass } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { pages } from "@/configs/paths/pages.path";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-4 py-10">
      <section className="w-full max-w-md rounded-xl border bg-card p-6 text-center sm:p-8">
        <Compass className="mx-auto size-8 text-muted-foreground" />
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          Страница не найдена
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Возможно, ссылка устарела или страница была перемещена.
        </p>
        <Link
          href={pages.TRIPS}
          className={buttonVariants({ className: "mt-6 h-11 w-full" })}
        >
          К путешествиям
        </Link>
      </section>
    </main>
  );
}
