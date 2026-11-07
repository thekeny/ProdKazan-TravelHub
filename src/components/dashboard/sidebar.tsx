"use client";
import { LogOut, Settings } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { TripSwitcher } from "@/components/dashboard/trip-switcher";
import { UserSettings } from "@/components/dashboard/user-settings";
import { Logo } from "@/components/layout/logo";
import { Button, buttonVariants } from "@/components/ui/button";
import { TRIP_NAVIGATION } from "@/configs/consts/navigation.const";
import { images } from "@/configs/paths/images.path";
import { pages } from "@/configs/paths/pages.path";
import { actionToast } from "@/lib/action-toast";
import { useTravel } from "@/providers/travel-provider";

export function Sidebar({
  onNavigate,
  hideLogo = false,
}: {
  onNavigate?: () => void;
  hideLogo?: boolean;
}) {
  const [loggingOut, setLoggingOut] = useState(false);
  const { username, logout } = useTravel();
  const router = useRouter();
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex min-h-full flex-col p-5">
      {!hideLogo && (
        <div className="pt-2">
          <Logo />
        </div>
      )}
      <TripSwitcher onNavigate={onNavigate} />
      <p className="section-label mt-6 mb-2 px-1">Разделы</p>
      <nav aria-label="Разделы путешествия" className="grid gap-1">
        {TRIP_NAVIGATION.map((link) => {
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
                className: "h-10 w-full justify-start gap-3",
              })}
            >
              <Icon className="size-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto pt-10">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center">
            <Image
              src={images.USER}
              alt=""
              width={40}
              height={40}
              className="size-10 object-contain"
            />
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-medium">
            {username}
          </span>
          <div className="flex shrink-0 items-center gap-[3px]">
            <Button
              variant="ghost"
              size="icon"
              className="size-10"
              aria-label="Выйти из аккаунта"
              title="Выйти"
              disabled={loggingOut}
              onClick={async () => {
                if (loggingOut) return;
                setLoggingOut(true);
                try {
                  await actionToast(
                    () => logout(),
                    "Выходим…",
                    "Вы вышли из аккаунта.",
                  );
                  router.replace(pages.LOGIN);
                } catch (logoutError) {
                  setError(
                    logoutError instanceof Error
                      ? logoutError.message
                      : "Не удалось выйти из аккаунта.",
                  );
                } finally {
                  setLoggingOut(false);
                }
              }}
            >
              <LogOut className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-10 shrink-0"
              aria-label="Настройки пользователя"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="size-4" />
            </Button>
          </div>
        </div>
        {settingsOpen && (
          <UserSettings onClose={() => setSettingsOpen(false)} />
        )}
        {error && (
          <p role="alert" className="mt-2 text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
