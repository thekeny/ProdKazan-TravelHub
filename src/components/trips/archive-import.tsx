"use client";
import { FileUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { pages } from "@/configs/paths/pages.path";
import { actionToast } from "@/lib/action-toast";
import { useOnline } from "@/lib/connectivity";
import { useTravel } from "@/providers/travel-provider";
export function ArchiveImport() {
  const { importArchive } = useTravel();
  const input = useRef<HTMLInputElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const busy = useRef(false);
  const [pending, setPending] = useState(false);
  const online = useOnline();
  const router = useRouter();
  return (
    <div className="mt-4 grid gap-2">
      <input
        ref={input}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          button.current?.focus({ preventScroll: true });
          if (!file || busy.current) return;
          busy.current = true;
          setPending(true);
          try {
            await actionToast(
              () => importArchive(file),
              "Импортируем…",
              "Создана копия поездки.",
            );
            router.push(pages.DASHBOARD);
          } catch {
            /* actionToast displays the failure. */
          } finally {
            busy.current = false;
            setPending(false);
          }
        }}
      />
      <Button
        ref={button}
        variant="outline"
        disabled={pending || !online}
        onClick={() => input.current?.click()}
      >
        <FileUp aria-hidden="true" />
        Импортировать JSON
      </Button>
    </div>
  );
}
