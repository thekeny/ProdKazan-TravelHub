"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Check, Copy, LoaderCircle, UserPlus, Users } from "lucide-react";
import { useEffect, useState } from "react";
import type {
  TripCollaborators,
  TripInviteLink,
} from "@/api/generated/types.gen";
import { Button } from "@/components/ui/button";
import { DialogPopup } from "@/components/ui/dialog-popup";
import { Field } from "@/components/ui/field";
import { Input, inputClass } from "@/components/ui/input";
import { COLLABORATION } from "@/configs/consts/collaboration.const";
import type { Trip } from "@/configs/types/travel.type";
import { actionToast } from "@/lib/action-toast";
import { useTravel } from "@/providers/travel-provider";

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function TripSharing({
  trip,
  onClose,
}: {
  trip: Trip;
  onClose: () => void;
}) {
  const { username, user, loadCollaborators, generateInviteCode } = useTravel();
  const [collaborators, setCollaborators] = useState<TripCollaborators | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usesError, setUsesError] = useState<string | null>(null);
  const [maxUses, setMaxUses] = useState("5");
  const [invite, setInvite] = useState<TripInviteLink | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reload, setReload] = useState(0);
  const owner = collaborators?.owner;
  const isOwner = owner
    ? user?.id && owner.id
      ? owner.id === user.id
      : owner.username === username
    : false;
  const canInvite = Boolean(owner && isOwner);

  // Provider callbacks are recreated with the provider value; only the trip
  // identity and explicit retries should trigger a reload.
  // biome-ignore lint/correctness/useExhaustiveDependencies: see comment above.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    loadCollaborators(trip.id)
      .then((value) => {
        if (!cancelled) setCollaborators(value);
      })
      .catch((loadError) => {
        if (!cancelled)
          setError(
            errorMessage(loadError, "Не удалось загрузить участников поездки."),
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [trip.id, reload]);

  async function generate() {
    if (generating) return;
    const uses = Number(maxUses);
    if (!Number.isInteger(uses) || uses < 1 || uses > COLLABORATION.MAX_USES) {
      setUsesError(`Укажите число от 1 до ${COLLABORATION.MAX_USES}.`);
      return;
    }
    setUsesError(null);
    setGenerating(true);
    setError(null);
    setCopied(false);
    try {
      setInvite(
        await actionToast(
          () => generateInviteCode(trip.id, uses),
          "Создаём код приглашения…",
          "Код приглашения готов.",
        ),
      );
    } catch (generateError) {
      setError(
        errorMessage(generateError, "Не удалось создать код приглашения."),
      );
    } finally {
      setGenerating(false);
    }
  }

  async function copy() {
    if (!invite) return;
    try {
      await navigator.clipboard.writeText(invite.code);
      setCopied(true);
    } catch {
      setError(
        "Не удалось скопировать код. Выделите его вручную и скопируйте.",
      );
    }
  }

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open && !generating) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="dialog-backdrop fixed inset-0 z-[60] bg-overlay/35" />
        <DialogPopup className="dialog-popup fixed inset-0 z-[60] m-auto flex h-fit max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg flex-col overflow-hidden rounded-xl border bg-background outline-none">
          <header className="shrink-0 border-b p-5 pr-14">
            <Dialog.Title className="text-xl">Совместный доступ</Dialog.Title>
            <Dialog.Description className="mt-1 user-text text-sm text-muted-foreground">
              Пригласите попутчиков: они смогут просматривать и редактировать
              поездку «{trip.name}».
            </Dialog.Description>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            {error && (
              <div className="mb-4 grid gap-2">
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
                {!collaborators && !loading && (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 justify-self-start"
                    onClick={() => setReload((value) => value + 1)}
                  >
                    Повторить
                  </Button>
                )}
              </div>
            )}

            <section aria-labelledby="trip-sharing-members">
              <h2
                id="trip-sharing-members"
                className="flex items-center gap-2 text-sm font-medium"
              >
                <Users aria-hidden="true" className="size-4" />
                Участники
              </h2>
              {loading ? (
                <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <LoaderCircle
                    aria-hidden="true"
                    className="size-4 animate-spin"
                  />
                  Загружаем участников…
                </p>
              ) : collaborators ? (
                <ul className="mt-3 grid gap-2">
                  <li className="flex items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2.5">
                    <span className="min-w-0 user-text font-medium">
                      {collaborators.owner.username}
                      {collaborators.owner.username === username && " (вы)"}
                    </span>
                    <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary-strong">
                      Владелец
                    </span>
                  </li>
                  {collaborators.collaborators.map((member) => (
                    <li
                      key={member.id ?? member.username}
                      className="flex items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2.5"
                    >
                      <span className="min-w-0 user-text">
                        {member.username}
                        {member.username === username && " (вы)"}
                      </span>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        Попутчик
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  Список участников недоступен.
                </p>
              )}
            </section>

            {canInvite ? (
              <section className="mt-6 border-t pt-5">
                <h2 className="text-sm font-medium">Пригласить по коду</h2>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Отправьте код попутчику. Он введёт его в разделе «Поездки» →
                  «Присоединиться по коду».
                </p>
                <div className="mt-3 flex items-end gap-2">
                  <div className="min-w-0 flex-1">
                    <Field
                      label="Сколько раз можно использовать код"
                      hint={`От 1 до ${COLLABORATION.MAX_USES}.`}
                      error={usesError ?? undefined}
                    >
                      {(id) => (
                        <Input
                          data-field-control
                          id={id}
                          type="number"
                          inputMode="numeric"
                          min={1}
                          max={COLLABORATION.MAX_USES}
                          step={1}
                          className={inputClass}
                          value={maxUses}
                          disabled={generating}
                          onChange={(event) => {
                            setMaxUses(event.target.value);
                            setUsesError(null);
                          }}
                        />
                      )}
                    </Field>
                  </div>
                  <Button
                    type="button"
                    className="h-11 shrink-0"
                    disabled={generating || loading}
                    onClick={() => void generate()}
                  >
                    {generating ? (
                      <LoaderCircle
                        aria-hidden="true"
                        className="size-4 animate-spin"
                      />
                    ) : (
                      <UserPlus aria-hidden="true" className="size-4" />
                    )}
                    {generating ? "Создаём…" : "Создать код"}
                  </Button>
                </div>

                {invite && (
                  <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-3">
                    <p className="text-xs text-muted-foreground">
                      Код для приглашения · использований: {invite.uses}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <Input
                        readOnly
                        aria-label="Код приглашения"
                        value={invite.code}
                        className="min-w-0 flex-1 font-mono"
                        onFocus={(event) => event.currentTarget.select()}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 shrink-0"
                        onClick={() => void copy()}
                      >
                        {copied ? (
                          <Check aria-hidden="true" className="size-4" />
                        ) : (
                          <Copy aria-hidden="true" className="size-4" />
                        )}
                        {copied ? "Скопировано" : "Копировать"}
                      </Button>
                    </div>
                  </div>
                )}
              </section>
            ) : (
              collaborators && (
                <p className="mt-6 border-t pt-5 text-sm text-muted-foreground">
                  Приглашать участников может только владелец поездки.
                </p>
              )
            )}
          </div>
        </DialogPopup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
