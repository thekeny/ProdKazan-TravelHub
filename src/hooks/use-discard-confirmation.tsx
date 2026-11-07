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
    <Dialog.Root modal open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Backdrop
          forceRender
          className="dialog-backdrop fixed inset-0 z-[70] bg-overlay/60"
        />
        <DialogPopup className="dialog-popup fixed inset-0 z-[70] m-auto h-fit max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-xl border bg-background p-6">
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
