"use client";
import { Dialog } from "@base-ui/react/dialog";
import { ArrowRight, KeyRound, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { DialogPopup } from "@/components/ui/dialog-popup";
import { Field } from "@/components/ui/field";
import { Input, inputClass } from "@/components/ui/input";
import { inviteCodeError } from "@/configs/consts/collaboration.const";
import { pages } from "@/configs/paths/pages.path";
import { actionToast } from "@/lib/action-toast";
import { useTravel } from "@/providers/travel-provider";
export function JoinTripButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="outline"
        className="h-auto min-h-12 min-w-0 whitespace-normal py-2"
        onClick={() => setOpen(true)}
      >
        <KeyRound />
        <span className="min-w-0">Присоединиться по коду</span>
      </Button>
      {open && <JoinTripDialog onClose={() => setOpen(false)} />}
    </>
  );
}
export function JoinTripDialog({ onClose }: { onClose: () => void }) {
  const { joinTrip } = useTravel();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);
  async function submit() {
    if (pendingRef.current) return;
    const codeError = inviteCodeError(code);
    if (codeError) {
      setError(codeError);
      return;
    }
    const invite = code.trim();
    pendingRef.current = true;
    setPending(true);
    setError(null);
    try {
      const joined = await actionToast(
        () => joinTrip(invite),
        "Присоединяемся к поездке…",
        "Вы присоединились к поездке.",
      );
      onClose();
      router.push(joined ? pages.DASHBOARD : pages.TRIPS);
    } catch (joinError) {
      pendingRef.current = false;
      setPending(false);
      setError(
        joinError instanceof Error
          ? joinError.message
          : "Не удалось присоединиться к поездке.",
      );
    }
  }
  return (
    <Dialog.Root
      open
      onOpenChange={(next) => {
        if (!next && !pendingRef.current) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="dialog-backdrop fixed inset-0 z-[60] bg-overlay/35" />
        <DialogPopup className="dialog-popup fixed inset-0 z-[60] m-auto h-fit max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-xl border bg-background p-5 sm:p-6">
          <header className="pr-10">
            <Dialog.Title className="text-xl">
              Присоединиться к поездке
            </Dialog.Title>
          </header>
          <form
            noValidate
            className="mt-5 grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
          >
            <Field
              label="Код приглашения"
              hint="Код создаётся в разделе «Совместный доступ»."
              error={error ?? undefined}
            >
              {(id) => (
                <Input
                  data-field-control
                  id={id}
                  className={inputClass}
                  value={code}
                  disabled={pending}
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  onChange={(event) => {
                    setCode(event.target.value);
                    setError(null);
                  }}
                />
              )}
            </Field>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-11"
                disabled={pending}
                onClick={onClose}
              >
                Отмена
              </Button>
              <Button type="submit" className="h-11" disabled={pending}>
                {pending ? (
                  <LoaderCircle
                    aria-hidden="true"
                    className="size-4 animate-spin"
                  />
                ) : (
                  <ArrowRight aria-hidden="true" className="size-4" />
                )}
                {pending ? "Присоединяемся…" : "Присоединиться"}
              </Button>
            </div>
          </form>
        </DialogPopup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
