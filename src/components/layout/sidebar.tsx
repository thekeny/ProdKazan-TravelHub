"use client";
import { LayoutDashboard, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/layout/logo";
import { TripSwitcher } from "@/components/layout/trip-switcher";
import { Button, buttonVariants } from "@/components/ui/button";
import { pages } from "@/configs/paths/pages.path";
import { useTravel } from "@/providers/travel-provider";
export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { username, logout } = useTravel();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex min-h-full flex-col p-5">
      <div className="pt-2">
        <Logo />
      </div>
      <TripSwitcher />
      <nav aria-label="Разделы путешествия" className="mt-6">
        <Link
          href={pages.DASHBOARD}
          onClick={onNavigate}
          aria-current="page"
          className={buttonVariants({
            className: "h-11 w-full justify-start gap-3",
          })}
        >
          <LayoutDashboard className="size-4" />
          Обзор
        </Link>
      </nav>
      <div className="mt-auto pt-10">
        <p className="truncate px-3 text-sm font-medium">{username}</p>
        {error && (
          <p role="alert" className="mt-2 text-sm text-destructive">
            {error}
          </p>
        )}
        <Button
          variant="ghost"
          className="mt-2 h-11 w-full justify-start gap-3 text-muted-foreground"
          onClick={() => {
            try {
              logout();
              router.replace(pages.LOGIN);
            } catch (error) {
              setError((error as Error).message);
            }
          }}
        >
          <LogOut className="size-4" />
          Выйти
        </Button>
      </div>
    </div>
  );
}
