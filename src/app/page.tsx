"use client";
import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { buttonVariants } from "@/components/ui/button";
import { pages } from "@/configs/paths/pages.path";
import { useTravel } from "@/providers/travel-provider";
export default function Page() {
  const { username } = useTravel();
  const href = username ? pages.TRIPS : pages.LOGIN;
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b">
        <nav
          aria-label="Основная навигация"
          className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-4 px-6"
        >
          <Logo />
          <Link
            href={href}
            className={buttonVariants({
              variant: "outline",
              className: "h-11 px-5",
            })}
          >
            {username ? "Мои путешествия" : "Войти"}
          </Link>
        </nav>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center gap-10 px-6 py-24">
        <Logo large />
        <Link
          href={href}
          className={buttonVariants({ className: "h-12 px-7" })}
        >
          Начать путешествие
        </Link>
      </main>
      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-3 px-6 py-6 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} TravelHub</span>
          <span>Путешествие как история</span>
        </div>
      </footer>
    </div>
  );
}
