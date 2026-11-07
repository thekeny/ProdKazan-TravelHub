"use client";

import { LogOut, Settings, UserRound } from "lucide-react";
import { useState } from "react";
import { UserSettings } from "@/components/dashboard/user-settings";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAccountLogout } from "@/hooks/use-account-logout";
import { useTravel } from "@/providers/travel-provider";

export function AccountMenu() {
  const { username } = useTravel();
  const { signOut, pending } = useAccountLogout();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-11 shrink-0"
              aria-label="Меню аккаунта"
              disabled={pending}
            />
          }
        >
          <UserRound aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-60 max-w-[calc(100vw-1.5rem)]"
        >
          <p className="user-text px-3 py-2 text-sm font-medium">{username}</p>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="min-h-11 cursor-pointer px-3"
            onClick={() => {
              setMenuOpen(false);
              setOpen(true);
            }}
          >
            <Settings aria-hidden="true" />
            Настройки аккаунта
          </DropdownMenuItem>
          <DropdownMenuItem
            className="min-h-11 cursor-pointer px-3"
            disabled={pending}
            onClick={() => {
              setMenuOpen(false);
              void signOut();
            }}
          >
            <LogOut aria-hidden="true" />
            Выйти
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {open && <UserSettings onClose={() => setOpen(false)} />}
    </>
  );
}
