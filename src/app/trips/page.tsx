"use client";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/layout/logo";
import { StorageWarning } from "@/components/layout/storage-warning";
import { JoinTripButton } from "@/components/trips/join-trip";
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
            onClick={async () => {
              try {
                await logout();
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
        <h1 className="mt-8 text-4xl leading-tight sm:text-5xl">
          Ваши путешествия
        </h1>
        <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
          Выберите поездку или создайте новую.
        </p>
        <StorageWarning className="mt-4" />
        <TripList />
        <JoinTripButton />
        {error && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {error}
          </p>
        )}
      </section>
    </main>
  );
}
