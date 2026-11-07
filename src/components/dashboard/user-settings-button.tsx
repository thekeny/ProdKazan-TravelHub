"use client";

import { Settings } from "lucide-react";
import { useState } from "react";
import { UserSettings } from "@/components/dashboard/user-settings";
import { Button } from "@/components/ui/button";
import { useTravel } from "@/providers/travel-provider";

export function UserSettingsButton() {
  const { remote } = useTravel();
  const [open, setOpen] = useState(false);
  if (!remote) return null;
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-11 shrink-0"
        aria-label="Настройки пользователя"
        onClick={() => setOpen(true)}
      >
        <Settings aria-hidden="true" />
      </Button>
      {open && <UserSettings onClose={() => setOpen(false)} />}
    </>
  );
}
