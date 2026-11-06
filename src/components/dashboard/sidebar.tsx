"use client";
import {
  FileText,
  Images,
  LayoutDashboard,
  LogOut,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { TripSwitcher } from "@/components/dashboard/trip-switcher";
import { DemoNotice } from "@/components/layout/demo-notice";
import { Logo } from "@/components/layout/logo";
import { Button, buttonVariants } from "@/components/ui/button";
import { pages } from "@/configs/paths/pages.path";
import { useTravel } from "@/providers/travel-provider";

const links = [
  { href: pages.DASHBOARD, label: "Обзор", icon: LayoutDashboard },
  { href: pages.GALLERY, label: "Галерея", icon: Images },
  { href: pages.DOCUMENTS, label: "Билеты и документы", icon: FileText },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { username, logout } = useTravel();
  const router = useRouter();
  const pathname = usePathname();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex min-h-full flex-col p-5">
      <div className="pt-2">
        <Logo />
      </div>
      <TripSwitcher onNavigate={onNavigate} />
      <nav aria-label="Разделы путешествия" className="mt-6 grid gap-1">
        {links.map((link) => {
          const Icon = link.icon;
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={buttonVariants({
                variant: active ? "secondary" : "ghost",
                className: "h-11 w-full justify-start gap-3",
              })}
            >
              <Icon className="size-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
      <DemoNotice className="mt-5" />
      <div className="mt-auto pt-10">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <UserRound className="size-5" />
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-medium">
            {username}
          </span>
          <Button
            variant="ghost"
            className="size-10"
            aria-label="Выйти из аккаунта"
            title="Выйти"
            onClick={() => {
              try {
                logout();
                router.replace(pages.LOGIN);
              } catch (logoutError) {
                setError(
                  logoutError instanceof Error
                    ? logoutError.message
                    : "Не удалось выйти из аккаунта.",
                );
              }
            }}
          >
            <LogOut className="size-4" />
          </Button>
        </div>
        {error && (
          <p role="alert" className="mt-2 text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
