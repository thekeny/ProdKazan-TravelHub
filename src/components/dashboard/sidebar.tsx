"use client";
import { LogOut, Settings } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { TripSwitcher } from "@/components/dashboard/trip-switcher";
import { UserSettings } from "@/components/dashboard/user-settings";
import { Logo } from "@/components/layout/logo";
import { Button, buttonVariants } from "@/components/ui/button";
import { TRIP_NAVIGATION } from "@/configs/consts/navigation.const";
import { images } from "@/configs/paths/images.path";
import { useAccountLogout } from "@/hooks/use-account-logout";
import { useTravel } from "@/providers/travel-provider";

export function Sidebar({
  onNavigate,
  hideLogo = false,
}: {
  onNavigate?: () => void;
  hideLogo?: boolean;
}) {
  const { signOut, pending: loggingOut } = useAccountLogout();
  const { username } = useTravel();
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = useState(false);
  return (
    <div className="flex min-h-full flex-col p-5">
      {!hideLogo && (
        <div className="pt-2">
          <Logo />
        </div>
      )}
      <TripSwitcher onNavigate={onNavigate} />
      <nav aria-label="Разделы путешествия" className="mt-6 grid gap-1">
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
        <div className="flex items-center">
          <span className="flex size-10 shrink-0 items-center justify-center">
            <Image
              src={images.USER}
              alt=""
              width={40}
              height={40}
              className="size-9 object-contain"
            />
          </span>
          <span className="min-w-0 flex-1 user-text whitespace-normal text-sm font-medium">
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
              onClick={() => void signOut()}
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
      </div>
    </div>
  );
}
