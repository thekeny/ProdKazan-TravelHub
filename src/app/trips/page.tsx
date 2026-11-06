"use client";
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
      <section className="flow-card">
        <Logo />
        <h1 className="mt-9 text-3xl font-semibold tracking-tight">
          Ваши путешествия
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Выберите путешествие или создайте новое.
        </p>
        <StorageWarning className="mt-4" />
        <TripList />
        <Button
          variant="ghost"
          className="mt-3 h-11 w-full bg-transparent text-muted-foreground hover:bg-muted"
          onClick={() => {
            try {
              logout();
              router.replace(pages.LOGIN);
            } catch (logoutError) {
              setError((logoutError as Error).message);
            }
          }}
        >
          Выйти
        </Button>
        {error && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {error}
          </p>
        )}
      </section>
    </main>
  );
}
