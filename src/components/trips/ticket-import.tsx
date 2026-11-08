"use client";
import { Dialog } from "@base-ui/react/dialog";
import { useRef, useState } from "react";
import { FormProvider } from "react-hook-form";
import type { TicketKind, TicketPreview } from "@/api/generated/types.gen";
import { Button } from "@/components/ui/button";
import { DialogPopup } from "@/components/ui/dialog-popup";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { TextSelect } from "@/components/ui/text-select";
import {
  INTEGRATIONS,
  TICKET_KINDS,
} from "@/configs/consts/integrations.const";
import type { Trip } from "@/configs/types/travel.type";
import { useDiscardConfirmation } from "@/hooks/use-discard-confirmation";
import { useFormValues } from "@/hooks/use-form-values";
import { actionToast } from "@/lib/action-toast";
import { useOnline } from "@/lib/connectivity";
import {
  EMPTY_TICKET,
  ticketBody,
  ticketErrors,
  ticketTimeHint,
  ticketValues,
} from "@/lib/tickets";
import { ApiError } from "@/lib/travel-api";
import { useTravel } from "@/providers/travel-provider";
import { TicketPointFields } from "./ticket-point-fields";

export function TicketImport({
  trip,
  onClose,
}: {
  trip: Trip;
  onClose: () => void;
}) {
  const { previewTicket, applyTicket } = useTravel();
  const online = useOnline();
  const [preview, setPreview] = useState<TicketPreview | null>(null);
  const [source, setSource] = useState("file");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [kind, setKind] = useState<TicketKind | "">("");
  const [kindError, setKindError] = useState<string>();
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  const fileButton = useRef<HTMLButtonElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [values, setValues, form] = useFormValues(EMPTY_TICKET, (next) =>
    ticketErrors(next, trip),
  );
  const { requestClose, confirmation } = useDiscardConfirmation(
    {
      values,
      source,
      url,
      file: file ? [file.name, file.size, file.lastModified] : null,
      kind,
    },
    onClose,
    pending,
  );
  async function recognize() {
    if (busy.current || !online) return;
    if (kindError && !kind) return;
    setError(null);
    if (
      source === "file" &&
      (!file ||
        file.size > INTEGRATIONS.ticketBytes ||
        !file.name.toLowerCase().endsWith(".pdf"))
    ) {
      setError(
        "Выберите PDF с текстовым слоем до 900 КиБ, не больше 8 страниц.",
      );
      return;
    }
    if (source === "url") {
      try {
        if (new URL(url).protocol !== "https:") throw new Error();
      } catch {
        setError("Введите публичную HTTPS-ссылку на билет.");
        return;
      }
    }
    busy.current = true;
    setPending(true);
    try {
      const result = await actionToast(
        () =>
          previewTicket(trip.id, {
            ...(source === "file" ? { file } : { url }),
            ...(kind ? { kind } : {}),
          }),
        "Распознаём билет…",
        "Проверьте распознанные данные.",
      );
      setPreview(result);
      form.reset(ticketValues(result));
    } catch (reason) {
      if (
        reason instanceof ApiError &&
        reason.validationCodes.includes("ticket_kind_ambiguous")
      ) {
        setKindError(reason.message);
        return;
      }
      setError(
        reason instanceof Error
          ? reason.message
          : "Не удалось распознать билет.",
      );
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) requestClose();
      }}
    >
      {confirmation}
      <Dialog.Portal>
        <Dialog.Backdrop className="dialog-backdrop fixed inset-0 z-[60] bg-overlay/35" />
        <DialogPopup className="dialog-popup fixed inset-3 z-[60] m-auto flex h-fit max-h-[calc(100dvh-1.5rem)] max-w-2xl flex-col overflow-hidden rounded-xl border bg-background sm:max-h-[calc(100dvh-4rem)]">
          <Dialog.Title className="shrink-0 border-b p-5 pr-14 text-xl">
            Импортировать билет
          </Dialog.Title>
          <FormProvider {...form}>
            <form
              noValidate
              className="flex min-h-0 flex-1 flex-col"
              onSubmit={async (event) => {
                event.preventDefault();
                if (!preview) {
                  await recognize();
                  return;
                }
                if (
                  busy.current ||
                  !online ||
                  !(await form.trigger(undefined, { shouldFocus: true }))
                )
                  return;
                busy.current = true;
                setPending(true);
                setError(null);
                try {
                  await actionToast(
                    () => applyTicket(trip.id, ticketBody(values)),
                    "Добавляем в поездку…",
                    "Билет добавлен в поездку.",
                  );
                  onClose();
                } catch (reason) {
                  setError(
                    reason instanceof Error
                      ? reason.message
                      : "Не удалось добавить билет.",
                  );
                } finally {
                  busy.current = false;
                  setPending(false);
                }
              }}
            >
              <div className="min-h-0 overflow-y-auto">
                <fieldset
                  disabled={pending || !online}
                  className="grid gap-4 p-5"
                >
                  {!preview ? (
                    <>
                      <Field label="Источник">
                        {(id) => (
                          <TextSelect
                            id={id}
                            value={source}
                            options={[
                              { value: "file", label: "PDF с устройства" },
                              { value: "url", label: "HTTPS-ссылка" },
                            ]}
                            onValueChange={setSource}
                          />
                        )}
                      </Field>
                      {source === "file" ? (
                        <div className="grid gap-2">
                          <input
                            ref={input}
                            className="hidden"
                            type="file"
                            accept="application/pdf,.pdf"
                            onChange={(event) => {
                              setFile(event.target.files?.[0] ?? null);
                              event.target.value = "";
                              fileButton.current?.focus({
                                preventScroll: true,
                              });
                            }}
                          />
                          <Button
                            ref={fileButton}
                            type="button"
                            variant="outline"
                            onClick={() => input.current?.click()}
                          >
                            Выбрать PDF
                          </Button>
                          <p className="user-text text-sm">
                            {file?.name ?? "Файл не выбран"}
                          </p>
                        </div>
                      ) : (
                        <Field label="Ссылка на билет">
                          {(id) => (
                            <Input
                              id={id}
                              value={url}
                              onChange={(event) => setUrl(event.target.value)}
                            />
                          )}
                        </Field>
                      )}
                      <Field label="Вид билета" error={kindError}>
                        {(id) => (
                          <TextSelect
                            data-field-control
                            id={id}
                            value={kind}
                            options={[
                              { value: "", label: "Определить автоматически" },
                              ...Object.entries(TICKET_KINDS).map(
                                ([value, label]) => ({ value, label }),
                              ),
                            ]}
                            onValueChange={(next) => {
                              if (!next || next in TICKET_KINDS) {
                                setKind(next as TicketKind | "");
                                if (next) setKindError(undefined);
                              }
                            }}
                          />
                        )}
                      </Field>
                    </>
                  ) : (
                    <>
                      <Field name="kind" label="Вид билета">
                        {(id) => (
                          <TextSelect
                            data-field-control
                            id={id}
                            value={values.kind}
                            options={Object.entries(TICKET_KINDS).map(
                              ([value, label]) => ({ value, label }),
                            )}
                            onValueChange={(next) => {
                              if (next in TICKET_KINDS)
                                setValues({
                                  ...values,
                                  kind: next as TicketKind,
                                });
                            }}
                          />
                        )}
                      </Field>
                      {(values.kind === "stay"
                        ? (["stay"] as const)
                        : (["departure", "arrival"] as const)
                      ).map((prefix) => (
                        <TicketPointFields
                          key={prefix}
                          prefix={prefix}
                          values={values}
                          onChange={setValues}
                          issues={preview.issues}
                        />
                      ))}
                      {(
                        [
                          ["start", "Начало", preview.startedAtHint],
                          [
                            "end",
                            "Окончание (необязательно)",
                            preview.endedAtHint,
                          ],
                        ] as const
                      ).map(([name, label, hint]) => (
                        <div key={name} className="grid gap-4 sm:grid-cols-2">
                          <Field
                            name={name}
                            label={label}
                            hint={preview.issues
                              ?.filter(
                                (issue) =>
                                  issue.field ===
                                  (name === "start" ? "startedAt" : "endedAt"),
                              )
                              .map((issue) => issue.msg)
                              .join(" ")}
                          >
                            {(id) => (
                              <Input
                                data-field-control
                                id={id}
                                type="datetime-local"
                                value={values[name]}
                                onChange={(event) =>
                                  setValues({
                                    ...values,
                                    [name]: event.target.value,
                                  })
                                }
                              />
                            )}
                          </Field>
                          <Field
                            name={`${name}Offset`}
                            label="Смещение UTC"
                            hint={ticketTimeHint(hint)}
                          >
                            {(id) => (
                              <Input
                                data-field-control
                                id={id}
                                placeholder="+03:00"
                                value={values[`${name}Offset`]}
                                onChange={(event) =>
                                  setValues({
                                    ...values,
                                    [`${name}Offset`]: event.target.value,
                                  })
                                }
                              />
                            )}
                          </Field>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setPreview(null)}
                      >
                        Выбрать другой билет
                      </Button>
                    </>
                  )}
                  {error && (
                    <p
                      role="alert"
                      className="user-text text-sm text-destructive"
                    >
                      {error}
                    </p>
                  )}
                </fieldset>
              </div>
              <div className="flex shrink-0 justify-end gap-3 border-t p-4">
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={requestClose}
                >
                  Отмена
                </Button>
                <Button type="submit" disabled={pending || !online}>
                  {pending
                    ? "Подождите…"
                    : preview
                      ? "Добавить в поездку"
                      : "Распознать"}
                </Button>
              </div>
            </form>
          </FormProvider>
        </DialogPopup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
