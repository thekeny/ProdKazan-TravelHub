"use client";
import { Dialog } from "@base-ui/react/dialog";
import { type ReactNode, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { DialogPopup } from "@/components/ui/dialog-popup";

export function ConfirmDelete({
  open,
  title,
  children,
  onClose,
  onConfirm,
  busy = false,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  busy?: boolean;
}) {
  const [pending, setPending] = useState(false);
  const locked = useRef(false);
  const cancel = useRef<HTMLButtonElement>(null);
  const disabled = busy || pending;
  return (
    <Dialog.Root
      modal
      open={open}
      onOpenChange={(next) => {
        if (!next && !disabled && !locked.current) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop
          forceRender
          className="dialog-backdrop fixed inset-0 z-[70] bg-overlay/60"
        />
        <DialogPopup
          initialFocus={cancel}
          className="dialog-popup fixed inset-0 z-[70] m-auto h-fit max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-xl bg-background p-6"
        >
          <Dialog.Title className="pr-10 text-lg font-semibold">
            {title}
          </Dialog.Title>
          <Dialog.Description className="mt-2 break-words text-sm text-muted-foreground">
            {children}
          </Dialog.Description>
          <div className="mt-6 flex justify-end gap-3">
            <Button
              ref={cancel}
              type="button"
              variant="outline"
              disabled={disabled}
              onClick={onClose}
            >
              Отмена
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={disabled}
              onClick={async () => {
                if (locked.current || disabled) return;
                locked.current = true;
                setPending(true);
                try {
                  await onConfirm();
                } finally {
                  locked.current = false;
                  setPending(false);
                }
              }}
            >
              {disabled ? "Удаляем…" : "Удалить"}
            </Button>
          </div>
        </DialogPopup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
