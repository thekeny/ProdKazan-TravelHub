"use client";
import { TicketPlus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Trip } from "@/configs/types/travel.type";
import { useOnline } from "@/lib/connectivity";
import { TicketImport } from "./ticket-import";
export function TicketImportButton({ trip }: { trip: Trip }) {
  const [open, setOpen] = useState(false);
  const online = useOnline();
  return (
    <>
      <Button
        variant="outline"
        disabled={!online}
        onClick={() => setOpen(true)}
      >
        <TicketPlus aria-hidden="true" />
        Импортировать билет
      </Button>
      {open && <TicketImport trip={trip} onClose={() => setOpen(false)} />}
    </>
  );
}
