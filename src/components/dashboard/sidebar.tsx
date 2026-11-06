"use client";
import { LayoutDashboard, Settings, UserRound } from "lucide-react";
import Link from "next/link";
import { TripSwitcher } from "@/components/dashboard/trip-switcher";
import { Logo } from "@/components/layout/logo";
import { Button, buttonVariants } from "@/components/ui/button";
import { pages } from "@/configs/paths/pages.path";
import { useTravel } from "@/providers/travel-provider";
export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { username } = useTravel();
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
      <div className="mt-auto flex items-center gap-3 pt-10">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <UserRound className="size-5" />
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {username}
        </span>
        <Button
          variant="ghost"
          className="size-10"
          aria-label="Настройки"
          title="Настройки"
        >
          <Settings className="size-4" />
        </Button>
      </div>
    </div>
  );
}
