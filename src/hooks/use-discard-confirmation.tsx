"use client";
import { Dialog } from "@base-ui/react/dialog";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { DialogPopup } from "@/components/ui/dialog-popup";

export function useDiscardConfirmation(
  values: unknown,
  close: () => void,
  busy = false,
) {
  const initial = useRef(JSON.stringify(values));
  const [open, setOpen] = useState(false);
  const requestClose = () => {
    if (busy) return;
    if (JSON.stringify(values) !== initial.current) setOpen(true);
    else close();
  };
  const confirmation = (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[70] bg-overlay/35" />
        <DialogPopup className="fixed top-1/2 left-1/2 z-[70] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-background p-6">
          <Dialog.Title className="pr-10 text-xl">
            Закрыть без сохранения?
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-muted-foreground">
            Несохранённые изменения будут потеряны.
          </Dialog.Description>
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Продолжить редактирование
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setOpen(false);
                close();
              }}
            >
              Закрыть без сохранения
            </Button>
          </div>
        </DialogPopup>
      </Dialog.Portal>
    </Dialog.Root>
  );
  return { requestClose, confirmation };
}
