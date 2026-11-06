"use client";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/layout/logo";
import { StorageWarning } from "@/components/layout/storage-warning";
import { TripList } from "@/components/trips/trip-list";
import { Button } from "@/components/ui/button";
import { pages } from "@/configs/paths/pages.path";
import { useTravel } from "@/providers/travel-provider";

export default function Page() {
  const { logout } = useTravel();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  return (
    <main className="flow-background">
      <section className="flow-card max-w-3xl">
        <div className="flex items-center justify-between gap-4">
          <Logo />
          <Button
            variant="ghost"
            className="h-10 px-3 text-muted-foreground"
            onClick={() => {
              try {
                logout();
                router.replace(pages.LOGIN);
              } catch (logoutError) {
                setError((logoutError as Error).message);
              }
            }}
          >
            <LogOut />
            <span className="hidden sm:inline">Выйти</span>
          </Button>
        </div>
        <p className="mt-8 text-[11px] font-semibold tracking-[0.18em] text-primary-strong uppercase">
          Ваш дневник
        </p>
        <h1 className="mt-2 text-4xl leading-tight sm:text-5xl">
          Ваши путешествия
        </h1>
        <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
          Выберите путешествие или создайте новое. Маршруты, события и материалы
          каждой поездки хранятся в одном месте.
        </p>
        <StorageWarning className="mt-4" />
        <TripList />
        {error && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {error}
          </p>
        )}
      </section>
    </main>
  );
}
